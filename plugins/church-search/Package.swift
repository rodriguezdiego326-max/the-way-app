// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ChurchSearch",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ChurchSearch",
            targets: ["ChurchSearchPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "ChurchSearchPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/ChurchSearchPlugin")
    ]
)
