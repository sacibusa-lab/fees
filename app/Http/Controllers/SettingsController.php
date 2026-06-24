<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Institution;
use App\Models\WebhookEvent;
use Illuminate\Support\Facades\Artisan;

class SettingsController extends Controller
{
    public function index()
    {
        return redirect()->route('settings.global');
    }

    public function global()
    {
        $institutionId = auth()->user()->institution_id;
        $institution = Institution::find($institutionId);
        return Inertia::render('Settings/Global', [
            'institution' => $institution
        ]);
    }

    public function updateGlobal(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'favicon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,ico|max:1024',
            'primary_color' => 'nullable|string|max:7',
            'sidebar_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
        ]);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads'), $filename);
            $validated['logo'] = '/uploads/' . $filename;
        }

        if ($request->hasFile('favicon')) {
            $file = $request->file('favicon');
            $filename = time() . '_fav_' . $file->getClientOriginalName();
            $file->move(public_path('uploads'), $filename);
            $validated['favicon'] = '/uploads/' . $filename;
        }

        $institutionId = auth()->user()->institution_id;
        $institution = Institution::find($institutionId);
        $institution->update($validated);

        return redirect()->back()->with('success', 'Global settings updated successfully.');
    }

    public function roles()
    {
        return Inertia::render('Settings/Roles');
    }

    public function api()
    {
        return Inertia::render('Settings/Api', [
            'paystack_public_key' => config('services.paystack.public_key'),
            'paystack_secret_key' => $this->maskKey(config('services.paystack.secret_key')),
        ]);
    }

    public function webhooks()
    {
        $institutionId = auth()->user()->institution_id;
        $webhooks = WebhookEvent::where('institution_id', $institutionId)
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($hook) {
                return [
                    'id' => $hook->id,
                    'event_type' => $hook->event_type,
                    'reference' => $hook->reference,
                    'payload' => $hook->payload,
                    'status' => $hook->status,
                    'error_message' => $hook->error_message,
                    'date' => $hook->created_at->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('Settings/Webhooks', [
            'webhooks' => $webhooks
        ]);
    }

    public function updateApi(Request $request)
    {
        $request->validate([
            'paystack_public_key' => 'required|string',
            'paystack_secret_key' => 'required|string',
        ]);

        $this->updateEnvFile([
            'PAYSTACK_PUBLIC_KEY' => $request->paystack_public_key,
            'PAYSTACK_SECRET_KEY' => $request->paystack_secret_key,
        ]);

        // Clear config cache to apply changes
        Artisan::call('config:clear');

        return redirect()->back()->with('success', 'API settings saved successfully.');
    }

    private function maskKey($key)
    {
        if (!$key) return '';
        return substr($key, 0, 7) . '****************' . substr($key, -4);
    }

    private function updateEnvFile(array $data)
    {
        $path = base_path('.env');
        if (file_exists($path)) {
            $content = file_get_contents($path);
            
            foreach ($data as $key => $value) {
                // Check if key exists
                if (preg_match("/^{$key}=/m", $content)) {
                    // Update existing key
                     $content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $content);
                } else {
                    // Append new key
                    $content .= "\n{$key}={$value}";
                }
            }

            file_put_contents($path, $content);
        }
    }
}
