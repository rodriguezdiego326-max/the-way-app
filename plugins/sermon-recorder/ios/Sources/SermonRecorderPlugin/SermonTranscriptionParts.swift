import Foundation
import AVFoundation
import Capacitor

struct TranscriptionExportedPart {
    let localURL: URL
    let startMs: Int
    let endMs: Int
    let sizeBytes: Int64
}

extension SermonRecorderPlugin {
    static let transcriptionPartSeconds: Double = 6 * 60
    static let transcriptionOverlapSeconds: Double = 3
    static let transcriptionMaxSeconds: Double = 3 * 60 * 60
    static let transcriptionMaxPartBytes: Int64 = 5_500_000
    static let transcriptionMinSplitSeconds: Double = 30

    @objc func prepareTranscriptionParts(_ call: CAPPluginCall) {
        guard let fileName = call.getString("fileName"), let source = fileURL(for: fileName),
              FileManager.default.fileExists(atPath: source.path) else {
            call.reject("This recording could not be prepared. Please try again.", "missing_file")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            let asset = AVURLAsset(url: source)
            let durationSeconds = CMTimeGetSeconds(asset.duration)
            guard durationSeconds.isFinite, durationSeconds > 0 else {
                DispatchQueue.main.async {
                    call.reject("This recording could not be prepared. Please try again.", "unsupported_audio")
                }
                return
            }
            guard durationSeconds <= Self.transcriptionMaxSeconds else {
                DispatchQueue.main.async {
                    call.reject("This recording is longer than 3 hours and cannot be transcribed yet.", "too_long")
                }
                return
            }

            let token = UUID().uuidString
            let folder = Self.transcriptionCacheFolder(token: token)
            do {
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let count = max(1, Int(ceil(durationSeconds / Self.transcriptionPartSeconds)))
                var exported: [TranscriptionExportedPart] = []
                var index = 0

                for slot in 0..<count {
                    try Self.exportBoundedParts(
                        asset: asset,
                        nominalStart: Double(slot) * Self.transcriptionPartSeconds,
                        nominalEnd: min(durationSeconds, Double(slot + 1) * Self.transcriptionPartSeconds),
                        durationSeconds: durationSeconds,
                        folder: folder,
                        index: &index,
                        parts: &exported
                    )
                }

                DispatchQueue.main.async {
                    self.resolvePreparedParts(call, token: token, exported: exported)
                }
            } catch {
                try? FileManager.default.removeItem(at: folder)
                let isTooLarge = (error as? TranscriptionPartError) == .tooLarge
                DispatchQueue.main.async {
                    call.reject(
                        isTooLarge
                            ? "This recording is too large to transcribe in one piece. Please try a shorter recording."
                            : "This recording could not be prepared. Please try again.",
                        isTooLarge ? "part_too_large" : "export_failed"
                    )
                }
            }
        }
    }

    private func resolvePreparedParts(_ call: CAPPluginCall, token: String, exported: [TranscriptionExportedPart]) {
        guard let bridge = bridge else {
            try? FileManager.default.removeItem(at: Self.transcriptionCacheFolder(token: token))
            call.reject("This recording could not be prepared. Please try again.", "portable_path_unavailable")
            return
        }

        var parts: [[String: Any]] = []
        for part in exported {
            guard let webURL = bridge.portablePath(fromLocalURL: part.localURL) else {
                try? FileManager.default.removeItem(at: Self.transcriptionCacheFolder(token: token))
                call.reject("This recording could not be prepared. Please try again.", "portable_path_unavailable")
                return
            }
            parts.append([
                "webPath": webURL.absoluteString,
                "startMs": part.startMs,
                "endMs": part.endMs,
                "sizeBytes": part.sizeBytes,
            ])
        }
        call.resolve(["token": token, "parts": parts])
    }

    @objc func cleanupTranscriptionParts(_ call: CAPPluginCall) {
        guard let token = call.getString("token"), UUID(uuidString: token) != nil else {
            call.reject("Temporary audio could not be cleaned up.", "invalid_token")
            return
        }
        try? FileManager.default.removeItem(at: Self.transcriptionCacheFolder(token: token))
        call.resolve()
    }

    static func transcriptionCacheFolder(token: String) -> URL {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return caches.appendingPathComponent("SermonTranscription", isDirectory: true)
            .appendingPathComponent(token, isDirectory: true)
    }

    static func exportBoundedParts(
        asset: AVAsset,
        nominalStart: Double,
        nominalEnd: Double,
        durationSeconds: Double,
        folder: URL,
        index: inout Int,
        parts: inout [TranscriptionExportedPart]
    ) throws {
        let startSeconds = max(0, nominalStart - (nominalStart > 0 ? transcriptionOverlapSeconds : 0))
        let endSeconds = min(durationSeconds, nominalEnd + transcriptionOverlapSeconds)
        let target = folder.appendingPathComponent("part-\(index).m4a")
        try exportTranscriptionPart(asset: asset, startSeconds: startSeconds, endSeconds: endSeconds, to: target)

        let size = (try FileManager.default.attributesOfItem(atPath: target.path)[.size] as? NSNumber)?.int64Value ?? 0
        guard size > 0 else {
            throw TranscriptionPartError.exportFailed
        }

        if size <= transcriptionMaxPartBytes {
            parts.append(TranscriptionExportedPart(
                localURL: target,
                startMs: Int(startSeconds * 1000),
                endMs: Int(endSeconds * 1000),
                sizeBytes: size
            ))
            index += 1
            return
        }

        try? FileManager.default.removeItem(at: target)
        let length = nominalEnd - nominalStart
        guard length / 2 >= transcriptionMinSplitSeconds else {
            throw TranscriptionPartError.tooLarge
        }
        let middle = nominalStart + length / 2
        try exportBoundedParts(asset: asset, nominalStart: nominalStart, nominalEnd: middle, durationSeconds: durationSeconds, folder: folder, index: &index, parts: &parts)
        try exportBoundedParts(asset: asset, nominalStart: middle, nominalEnd: nominalEnd, durationSeconds: durationSeconds, folder: folder, index: &index, parts: &parts)
    }

    static func exportTranscriptionPart(asset: AVAsset, startSeconds: Double, endSeconds: Double, to target: URL) throws {
        guard let session = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
            throw TranscriptionPartError.exportFailed
        }
        try? FileManager.default.removeItem(at: target)
        session.outputURL = target
        session.outputFileType = .m4a
        session.timeRange = CMTimeRange(
            start: CMTime(seconds: startSeconds, preferredTimescale: 600),
            duration: CMTime(seconds: endSeconds - startSeconds, preferredTimescale: 600)
        )

        let finished = DispatchSemaphore(value: 0)
        session.exportAsynchronously { finished.signal() }
        finished.wait()

        guard session.status == .completed else {
            throw TranscriptionPartError.exportFailed
        }
    }
}

private enum TranscriptionPartError: Error {
    case exportFailed
    case tooLarge
}
