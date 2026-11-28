import Foundation
import Capacitor
import StoreKit
import UIKit

// Sandbox harness only. No production purchases or production entitlement delivery.
@objc(AppleSubscriptionsPlugin)
public class AppleSubscriptionsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleSubscriptionsPlugin"
    public let jsName = "AppleSubscriptions"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "transactions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise)
    ]
    private let productIDs: Set<String> = [
        "com.rfgforge.solapath.plus.monthly", "com.rfgforge.solapath.plus.annual",
        "com.rfgforge.solapath.family.monthly", "com.rfgforge.solapath.family.annual"
    ]
    private var updates: Task<Void, Never>?
    public override func load() {
        updates = Task { [weak self] in
            for await _ in Transaction.updates {
                guard let self = self else { return }
                self.notifyListeners("transactionsChanged", data: [:])
            }
        }
    }
    deinit { updates?.cancel() }

    private func requireSandbox() async throws {
        guard #available(iOS 16.0, *) else { throw Failure("ios_16_required") }
        guard case .verified(let app) = try await AppTransaction.shared,
              app.environment == .sandbox,
              app.bundleID == "com.rfgforge.solapath" else {
            throw Failure("sandbox_required")
        }
    }
    private struct Failure: LocalizedError {
        let message: String
        init(_ message: String) { self.message = message }
        var errorDescription: String? { message }
    }
    @objc func products(_ call: CAPPluginCall) {
        Task {
            do {
                try await requireSandbox()
                let products = try await Product.products(for: productIDs)
                var rows: [[String: Any]] = []
                for product in products where product.type == .autoRenewable {
                    guard let subscription = product.subscription else { continue }
                    let eligible = await subscription.isEligibleForIntroOffer
                    var row: [String: Any] = ["id": product.id, "name": product.displayName,
                        "price": product.displayPrice, "eligibleForIntro": eligible]
                    if let offer = subscription.introductoryOffer, offer.paymentMode == .freeTrial {
                        row["trialValue"] = offer.period.value
                        row["trialUnit"] = String(describing: offer.period.unit)
                    }
                    rows.append(row)
                }
                call.resolve(["environment": "Sandbox", "products": rows])
            } catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId"), productIDs.contains(id),
              let rawToken = call.getString("accountToken"), let token = UUID(uuidString: rawToken) else {
            call.reject("invalid_purchase_request"); return
        }
        Task { @MainActor in
            do {
                try await requireSandbox() // Reject production BEFORE opening Apple's purchase sheet.
                guard let product = try await Product.products(for: [id]).first else { throw Failure("product_unavailable") }
                guard let subscription = product.subscription,
                      let offer = subscription.introductoryOffer,
                      offer.paymentMode == .freeTrial,
                      offer.period.unit == .week, offer.period.value == 1 else { throw Failure("trial_unavailable") }
                let eligible = await subscription.isEligibleForIntroOffer
                guard eligible else { throw Failure("trial_unavailable") }
                switch try await product.purchase(options: [.appAccountToken(token)]) {
                case .success(let result):
                    guard case .verified(let transaction) = result else { throw Failure("unverified_transaction") }
                    guard transaction.appAccountToken == token else { throw Failure("account_mismatch") }
                    call.resolve(["status": "purchased", "signedTransaction": result.jwsRepresentation])
                    // Finish only after the server verifies this account and acknowledges the sample.
                case .userCancelled: call.resolve(["status": "cancelled"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: throw Failure("unknown_purchase_result")
                }
            } catch { call.reject(error.localizedDescription) }
        }
    }
    private func transactionSamples() async throws -> [String] {
        try await requireSandbox()
        var samples: [UInt64: String] = [:]
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, productIDs.contains(tx.productID) { samples[tx.id] = result.jwsRepresentation }
        }
        for await result in Transaction.unfinished {
            if case .verified(let tx) = result, productIDs.contains(tx.productID) { samples[tx.id] = result.jwsRepresentation }
        }
        return Array(samples.values)
    }
    @objc func transactions(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(["transactions": try await transactionSamples()]) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func restore(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await requireSandbox()
                try await AppStore.sync() // Only from an explicit Restore button.
                call.resolve(["transactions": try await transactionSamples()])
            } catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func finish(_ call: CAPPluginCall) {
        guard let rawID = call.getString("transactionId"), let id = UInt64(rawID) else { call.reject("invalid_transaction"); return }
        Task {
            do {
                try await requireSandbox()
                for await result in Transaction.unfinished {
                    if case .verified(let tx) = result, tx.id == id, productIDs.contains(tx.productID) {
                        await tx.finish(); break
                    }
                }
                call.resolve()
            } catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func manage(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await requireSandbox()
                guard let scene = self.bridge?.viewController?.view.window?.windowScene else { throw Failure("scene_unavailable") }
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve()
            } catch { call.reject(error.localizedDescription) }
        }
    }
}
