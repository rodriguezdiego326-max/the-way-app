import Foundation

final class TranscriptionUploadRegistry {
    private let lock = NSLock()
    private var uploadsByJob: [String: [UUID: URLSessionUploadTask]] = [:]

    func register(_ task: URLSessionUploadTask, key: UUID, jobId: String) {
        lock.lock()
        defer { lock.unlock() }
        uploadsByJob[jobId, default: [:]][key] = task
    }

    func remove(key: UUID, jobId: String) {
        lock.lock()
        defer { lock.unlock() }
        uploadsByJob[jobId]?[key] = nil
        if uploadsByJob[jobId]?.isEmpty == true {
            uploadsByJob[jobId] = nil
        }
    }

    func takeAll(jobId: String) -> [URLSessionUploadTask] {
        lock.lock()
        defer { lock.unlock() }
        guard let tasks = uploadsByJob.removeValue(forKey: jobId) else { return [] }
        return Array(tasks.values)
    }

    func takeEverything() -> [URLSessionUploadTask] {
        lock.lock()
        defer { lock.unlock() }
        let tasks = uploadsByJob.values.flatMap { $0.values }
        uploadsByJob.removeAll()
        return tasks
    }
}
