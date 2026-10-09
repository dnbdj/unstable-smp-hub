package com.unstablesmp.hub;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Minimal WebView shell: loads the hosted Hub (Vercel URL below).
 *  In-app episode taps stay inside; "Watch on YouTube" links open the
 *  YouTube app / browser. Phone back button walks WebView history. */
public class MainActivity extends Activity {

    // Primary site + fallback. The wrapper follows whatever is live:
    // Base44 while published, Vercel otherwise. No rebuild needed.
    private static final String SITE_URL = "https://the-unstable-smp.base44.app/";
    private static final String FALLBACK_URL = "https://unstable-smp-hub.vercel.app/";

    private WebView web;
    private boolean onFallback = false;

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
            private void useFallback() {
                if (!onFallback) {
                    onFallback = true;
                    web.loadUrl(FALLBACK_URL);
                }
            }
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (!onFallback && failingUrl != null && failingUrl.startsWith(SITE_URL)) useFallback();
            }
            @Override
            public void onReceivedHttpError(WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {
                if (!onFallback && request.isForMainFrame()) useFallback();
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
