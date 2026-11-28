// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "AppleSubscriptions",
    platforms: [.iOS(.v15)],
    products: [.library(name: "AppleSubscriptions", targets: ["AppleSubscriptionsPlugin"])],
    dependencies: [.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")],
    targets: [.target(name: "AppleSubscriptionsPlugin", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm")
    ], path: "ios/Sources/AppleSubscriptionsPlugin")]
)
