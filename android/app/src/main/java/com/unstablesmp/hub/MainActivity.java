package com.unstablesmp.hub;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/** Minimal WebView shell: loads the hosted Hub (Freebuff Sites URL below).
 *  In-app episode taps stay inside; "Watch on YouTube" links open the
 *  YouTube app / browser. Phone back button walks WebView history. */
public class MainActivity extends Activity {

    // Live site. The fallback is the same host on purpose: it gives a
    // transient blip one more full load instead of an error page.
    private static final String SITE_URL = "https://unstablesmp.freebuff.page/";
    private static final String FALLBACK_URL = "https://unstablesmp.freebuff.page/";

    private WebView web;
    private boolean onFallback = false;
    private int retries = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // localStorage = watch progress
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        web.setWebViewClient(new WebViewClient() {
            private void retryOrFallback() {
                if (onFallback) return;
                retries++;
                if (retries < 2) {
                    // Transient blip: retry the live site once before giving up.
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        if (!onFallback) web.loadUrl(SITE_URL);
                    }, 2000);
                } else {
                    onFallback = true;
                    Toast.makeText(MainActivity.this,
                        "Hub didn't load, retrying", Toast.LENGTH_LONG).show();
                    web.loadUrl(FALLBACK_URL);
                }
            }
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (!onFallback && failingUrl != null && failingUrl.startsWith(SITE_URL)) retryOrFallback();
            }
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {
                if (!onFallback && request.isForMainFrame()) retryOrFallback();
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                if (host == null) return false;
                // YouTube watch links belong in the YouTube app, not the shell.
                if (host.contains("youtube.com") || host.contains("youtu.be")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                    } catch (Exception ignored) { return false; }
                    return true;
                }
                return false; // everything else stays in-app
            }
        });
        setContentView(web, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        web.loadUrl(SITE_URL);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
