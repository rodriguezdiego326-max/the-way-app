import Foundation
import AVFoundation
import Capacitor

@objc(SermonRecorderPlugin)
public class SermonRecorderPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    public let identifier = "SermonRecorderPlugin"
    public let jsName = "SermonRecorder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "discard", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "togglePlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seekPlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopPlayback", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playbackStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepareTranscriptionParts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cleanupTranscriptionParts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "uploadTranscriptionPart", returnType: CAPPluginReturnPromise)
    ]

    private static let folderName = "SermonRecordings"

    private var recorder: AVAudioRecorder?
    private var recordingFileName: String?
    private var recordingStartedAt: String?
    private var userPaused = false
    private var wasInterrupted = false

    private var player: AVAudioPlayer?
    private var playerFileName: String?

    private enum RecorderError: Error {
        case couldNotStart
    }

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleAudioInterruption(_ notification: Notification) {
        guard
            let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: raw),
            type == .began,
            let recorder = recorder,
            recorder.isRecording
        else { return }
        recorder.pause()
        wasInterrupted = true
    }

    @objc func start(_ call: CAPPluginCall) {
        guard recorder == nil else {
            call.reject("A sermon recording is already in progress.", "already_recording")
            return
        }
        requestRecordPermission { granted in
            DispatchQueue.main.async {
                guard granted else {
                    call.reject("Microphone access is needed to record a sermon.", "denied")
                    return
                }
                do {
                    try self.activateRecordingSession()
                    let fileName = "\(UUID().uuidString).m4a"
                    let url = self.recordingsDirectory().appendingPathComponent(fileName)
                    let settings: [String: Any] = [
                        AVFormatIDKey: kAudioFormatMPEG4AAC,
                        AVSampleRateKey: 44100,
                        AVNumberOfChannelsKey: 1,
                        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
                        AVEncoderBitRateKey: 96000
                    ]
                    let newRecorder = try AVAudioRecorder(url: url, settings: settings)
                    guard newRecorder.prepareToRecord(), newRecorder.record() else {
                        throw RecorderError.couldNotStart
                    }
                    self.recorder = newRecorder
                    self.recordingFileName = fileName
                    self.recordingStartedAt = ISO8601DateFormatter().string(from: Date())
                    self.userPaused = false
                    self.wasInterrupted = false
                    call.resolve(self.recordingStatusPayload())
                } catch {
                    call.reject("Recording could not start. Please try again.", "start_failed")
                }
            }
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        guard let recorder = recorder, recorder.isRecording else {
            call.resolve(recordingStatusPayload())
            return
        }
        recorder.pause()
        userPaused = true
        call.resolve(recordingStatusPayload())
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard let recorder = recorder else {
            call.reject("No sermon recording is in progress.", "not_recording")
            return
        }
        if recorder.isRecording {
            call.resolve(recordingStatusPayload())
            return
        }
        do {
            try activateRecordingSession()
            guard recorder.record() else { throw RecorderError.couldNotStart }
            userPaused = false
            wasInterrupted = false
            call.resolve(recordingStatusPayload())
        } catch {
            call.reject("Recording could not resume. Please try again.", "resume_failed")
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let recorder = recorder, let fileName = recordingFileName, let startedAt = recordingStartedAt else {
            call.reject("No sermon recording is in progress.", "not_recording")
            return
        }
        let durationMs = Int(recorder.currentTime * 1000)
        let interrupted = wasInterrupted || (!recorder.isRecording && !userPaused)
        recorder.stop()
        clearRecordingState()
        releaseRecordingSession()

        let url = recordingsDirectory().appendingPathComponent(fileName)
        let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.intValue ?? 0
        guard size > 0, durationMs > 0 else {
            try? FileManager.default.removeItem(at: url)
            call.reject("The recording was empty. Please try again.", "empty")
            return
        }
        call.resolve([
            "fileName": fileName,
            "durationMs": durationMs,
            "startedAt": startedAt,
            "interrupted": interrupted
        ])
    }

    @objc func discard(_ call: CAPPluginCall) {
        let fileName = recordingFileName
        recorder?.stop()
        clearRecordingState()
        releaseRecordingSession()
        if let fileName = fileName {
            try? FileManager.default.removeItem(at: recordingsDirectory().appendingPathComponent(fileName))
        }
        call.resolve()
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(recordingStatusPayload())
    }

    @objc func playRecording(_ call: CAPPluginCall) {
        guard recorder == nil else {
            call.reject("Finish the recording before playing it.", "recording_active")
            return
        }
        guard
            let fileName = call.getString("fileName"),
            let url = fileURL(for: fileName),
            FileManager.default.fileExists(atPath: url.path)
        else {
            call.reject("This recording could not be played. Please try again.", "missing_file")
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [])
            try session.setActive(true)
            let newPlayer = try AVAudioPlayer(contentsOf: url)
            newPlayer.delegate = self
            newPlayer.prepareToPlay()
            guard newPlayer.play() else { throw RecorderError.couldNotStart }
            player?.stop()
            player = newPlayer
            playerFileName = fileName
            call.resolve(playbackPayload())
        } catch {
            call.reject("This recording could not be played. Please try again.", "playback_failed")
        }
    }

    @objc func togglePlayback(_ call: CAPPluginCall) {
        guard let player = player else {
            call.reject("This recording could not be played. Please try again.", "not_loaded")
            return
        }
        if player.isPlaying {
            player.pause()
        } else {
            guard player.play() else {
                call.reject("This recording could not be played. Please try again.", "playback_failed")
                return
            }
        }
        call.resolve(playbackPayload())
    }

    @objc func seekPlayback(_ call: CAPPluginCall) {
        guard let player = player else {
            call.reject("This recording could not be played. Please try again.", "not_loaded")
            return
        }
        let requested = Double(call.getInt("positionMs") ?? 0) / 1000
        player.currentTime = min(max(requested, 0), player.duration)
        call.resolve(playbackPayload())
    }

    @objc func stopPlayback(_ call: CAPPluginCall) {
        player?.stop()
        player = nil
        playerFileName = nil
        call.resolve()
    }

    @objc func playbackStatus(_ call: CAPPluginCall) {
        call.resolve(playbackPayload())
    }

    @objc func deleteRecording(_ call: CAPPluginCall) {
        guard let fileName = call.getString("fileName"), let url = fileURL(for: fileName) else {
            call.reject("This recording could not be deleted. Please try again.", "invalid_file")
            return
        }
        if playerFileName == fileName {
            player?.stop()
            player = nil
            playerFileName = nil
        }
        do {
            if FileManager.default.fileExists(atPath: url.path) {
                try FileManager.default.removeItem(at: url)
            }
            call.resolve()
        } catch {
            call.reject("This recording could not be deleted. Please try again.", "delete_failed")
        }
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        player.currentTime = 0
    }

    private func requestRecordPermission(_ completion: @escaping (Bool) -> Void) {
        let session = AVAudioSession.sharedInstance()
        switch session.recordPermission {
        case .granted:
            completion(true)
        case .denied:
            completion(false)
        default:
            session.requestRecordPermission { granted in completion(granted) }
        }
    }

    private func activateRecordingSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)
    }

    private func releaseRecordingSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func clearRecordingState() {
        recorder = nil
        recordingFileName = nil
        recordingStartedAt = nil
        userPaused = false
        wasInterrupted = false
    }

    private func recordingStatusPayload() -> [String: Any] {
        guard let recorder = recorder else {
            return ["state": "idle", "elapsedMs": 0, "interrupted": false, "startedAt": ""]
        }
        let isRecording = recorder.isRecording
        if !isRecording && !userPaused {
            wasInterrupted = true
        }
        return [
            "state": isRecording ? "recording" : "paused",
            "elapsedMs": Int(recorder.currentTime * 1000),
            "interrupted": wasInterrupted,
            "startedAt": recordingStartedAt ?? ""
        ]
    }

    private func playbackPayload() -> [String: Any] {
        guard let player = player else {
            return ["loaded": false, "playing": false, "positionMs": 0, "durationMs": 0]
        }
        return [
            "loaded": true,
            "playing": player.isPlaying,
            "positionMs": Int(player.currentTime * 1000),
            "durationMs": Int(player.duration * 1000)
        ]
    }

    private func recordingsDirectory() -> URL {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        var directory = documents.appendingPathComponent(Self.folderName, isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? directory.setResourceValues(values)
        return directory
    }

    func fileURL(for fileName: String) -> URL? {
        guard fileName.hasSuffix(".m4a"), !fileName.contains("/"), !fileName.contains("..") else { return nil }
        return recordingsDirectory().appendingPathComponent(fileName)
    }
}
