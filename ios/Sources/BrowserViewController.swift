import UIKit
import WebKit

/// Minimal browser: address bar + back/forward + WebView, opens on Google.
class BrowserViewController: UIViewController, WKNavigationDelegate, UITextFieldDelegate {

    static let home = "https://www.google.com/"

    private var webView: WKWebView!
    private var urlField: UITextField!
    private var backButton: UIButton!
    private var forwardButton: UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.04, green: 0.06, blue: 0.10, alpha: 1.0)

        let bar = UIStackView()
        bar.axis = .horizontal
        bar.spacing = 8
        bar.translatesAutoresizingMaskIntoConstraints = false

        backButton = UIButton(type: .system)
        backButton.setTitle("‹", for: .normal)
        backButton.titleLabel?.font = UIFont.systemFont(ofSize: 28)
        backButton.tintColor = .white
        backButton.addTarget(self, action: #selector(goBack), for: .touchUpInside)

        forwardButton = UIButton(type: .system)
        forwardButton.setTitle("›", for: .normal)
        forwardButton.titleLabel?.font = UIFont.systemFont(ofSize: 28)
        forwardButton.tintColor = .white
        forwardButton.addTarget(self, action: #selector(goForward), for: .touchUpInside)

        urlField = UITextField()
        urlField.placeholder = "Search or address"
        urlField.borderStyle = .roundedRect
        urlField.keyboardType = .URL
        urlField.autocapitalizationType = .none
        urlField.autocorrectionType = .no
        urlField.returnKeyType = .go
        urlField.delegate = self

        let goButton = UIButton(type: .system)
        goButton.setTitle("Go", for: .normal)
        goButton.tintColor = .white
        goButton.addTarget(self, action: #selector(goPressed), for: .touchUpInside)

        bar.addArrangedSubview(backButton)
        bar.addArrangedSubview(forwardButton)
        bar.addArrangedSubview(urlField)
        bar.addArrangedSubview(goButton)

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.allowsBackForwardNavigationGestures = true

        view.addSubview(bar)
        view.addSubview(webView)

        let guide = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            bar.topAnchor.constraint(equalTo: guide.topAnchor, constant: 8),
            bar.leadingAnchor.constraint(equalTo: guide.leadingAnchor, constant: 8),
            bar.trailingAnchor.constraint(equalTo: guide.trailingAnchor, constant: -8),
            webView.topAnchor.constraint(equalTo: bar.bottomAnchor, constant: 8),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        updateNavButtons()
        webView.load(URLRequest(url: URL(string: Self.home)!))
    }

    @objc private func goPressed() {
        urlField.resignFirstResponder()
        navigateTo(urlField.text ?? "")
    }

    @objc private func goBack() { webView.goBack() }
    @objc private func goForward() { webView.goForward() }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        navigateTo(textField.text ?? "")
        return true
    }

    private func navigateTo(_ text: String) {
        let t = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return }
        let urlString: String
        if t.lowercased().hasPrefix("http://") || t.lowercased().hasPrefix("https://") {
            urlString = t
        } else if !t.contains(" ") && t.contains(".") {
            urlString = "https://" + t
        } else {
            urlString = "https://www.google.com/search?q=" +
                (t.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? t)
        }
        if let url = URL(string: urlString) {
            webView.load(URLRequest(url: url))
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if !(urlField.isFirstResponder) {
            urlField.text = webView.url?.absoluteString
        }
        updateNavButtons()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(.allow)
    }

    private func updateNavButtons() {
        backButton.isEnabled = webView.canGoBack
        forwardButton.isEnabled = webView.canGoForward
    }
}
