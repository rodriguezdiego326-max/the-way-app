import Foundation
import Capacitor
import MapKit

@objc(ChurchSearchPlugin)
public class ChurchSearchPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ChurchSearchPlugin"
    public let jsName = "ChurchSearch"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "searchChurches", returnType: CAPPluginReturnPromise)
    ]

    private let maxResults = 25

    @objc func searchChurches(_ call: CAPPluginCall) {
        let rawQuery = call.getString("query")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !rawQuery.isEmpty else {
            call.reject("Enter a church name to search.")
            return
        }

        let naturalQuery = rawQuery.lowercased().contains("church") ? rawQuery : "\(rawQuery) church"
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = naturalQuery
        request.resultTypes = .pointOfInterest

        MKLocalSearch(request: request).start { response, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }

            let results: [[String: Any]] = (response?.mapItems ?? [])
                .prefix(self.maxResults)
                .map { item in
                    let placemark = item.placemark
                    var entry: [String: Any] = [
                        "name": item.name ?? "",
                        "latitude": placemark.coordinate.latitude,
                        "longitude": placemark.coordinate.longitude
                    ]
                    if let city = placemark.locality { entry["city"] = city }
                    if let state = placemark.administrativeArea { entry["state"] = state }
                    if let street = placemark.thoroughfare {
                        entry["address"] = [placemark.subThoroughfare, street].compactMap { $0 }.joined(separator: " ")
                    }
                    if let website = item.url?.absoluteString { entry["website"] = website }
                    return entry
                }

            call.resolve(["results": results])
        }
    }
}
