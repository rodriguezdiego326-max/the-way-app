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
    static let transcriptionUploadHardLimitBytes: Int64 = 6_000_000
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
        let parts: [[String: Any]] = exported.enumerated().map { index, part in
            [
                "partIndex": index,
                "startMs": part.startMs,
                "endMs": part.endMs,
                "sizeBytes": part.sizeBytes,
            ]
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

    @objc func cancelTranscriptionUploads(_ call: CAPPluginCall) {
        guard let jobId = call.getString("jobId"), UUID(uuidString: jobId) != nil else {
            call.reject("Transcription could not be cancelled. Please try again.", "invalid_job")
            return
        }
        let tasks = transcriptionUploads.takeAll(jobId: jobId)
        tasks.forEach { $0.cancel() }
        call.resolve(["cancelledCount": tasks.count])
    }

    @objc func uploadTranscriptionPart(_ call: CAPPluginCall) {
        guard let jobId = call.getString("jobId"), UUID(uuidString: jobId) != nil,
              let token = call.getString("token"), UUID(uuidString: token) != nil,
              let partIndex = call.getInt("partIndex"), partIndex >= 0,
              let uploadURLString = call.getString("uploadUrl"), let uploadURL = URL(string: uploadURLString),
              uploadURL.scheme == "https",
              uploadURL.path.hasPrefix("/storage/v1/object/sermon-transcription-temp/"),
              let accessToken = call.getString("accessToken"), !accessToken.isEmpty,
              let apiKey = call.getString("apiKey"), !apiKey.isEmpty,
              let file = Self.transcriptionPartFile(token: token, index: partIndex),
              let size = Self.uploadableSize(of: file) else {
            call.reject("This recording could not be uploaded. Please try again.", "invalid_upload")
            return
        }

        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        request.setValue("audio/mp4", forHTTPHeaderField: "Content-Type")

        let registry = transcriptionUploads
        let uploadKey = UUID()
        let task = URLSession.shared.uploadTask(with: request, fromFile: file) { _, response, error in
            registry.remove(key: uploadKey, jobId: jobId)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let wasCancelled = (error as? URLError)?.code == .cancelled
            DispatchQueue.main.async {
                if wasCancelled {
                    call.reject("This upload was cancelled.", "upload_cancelled")
                    return
                }
                guard error == nil, (200..<300).contains(status) else {
                    call.reject("This recording could not be uploaded. Please try again.", "upload_failed")
                    return
                }
                call.resolve(["success": true, "httpStatus": status, "uploadedBytes": size])
            }
        }
        registry.register(task, key: uploadKey, jobId: jobId)
        task.resume()
    }

    static func transcriptionPartFile(token: String, index: Int) -> URL? {
        let folder = transcriptionCacheFolder(token: token).standardizedFileURL
        let file = folder.appendingPathComponent("part-\(index).m4a").standardizedFileURL
        guard file.deletingLastPathComponent() == folder,
              FileManager.default.fileExists(atPath: file.path) else { return nil }
        return file
    }

    static func uploadableSize(of file: URL) -> Int64? {
        let size = (try? FileManager.default.attributesOfItem(atPath: file.path)[.size] as? NSNumber)?.int64Value ?? 0
        guard size > 0, size < transcriptionUploadHardLimitBytes else { return nil }
        return size
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
