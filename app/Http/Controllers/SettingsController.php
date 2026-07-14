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
        $institution = auth()->user()->institution;
        $settings = $institution->settings ?? [];

        return Inertia::render('Settings/Api', [
            'paystack_public_key' => config('services.paystack.public_key'),
            'paystack_secret_key' => $this->maskKey(config('services.paystack.secret_key')),
            'sms_provider' => config('sms.default', 'termii'),
            'sms_enabled' => $settings['sms_enabled'] ?? false,
            'termii_api_key' => $this->maskKey(config('sms.providers.termii.api_key')),
            'termii_sender_id' => $settings['termii_sender_id'] ?? null,
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
            'sms_provider' => 'nullable|string',
            'sms_enabled' => 'nullable|boolean',
            'termii_api_key' => 'nullable|string',
            'termii_sender_id' => 'nullable|string',

        ]);

        $envUpdates = [
            'PAYSTACK_PUBLIC_KEY' => $request->paystack_public_key,
            'PAYSTACK_SECRET_KEY' => $request->paystack_secret_key,
        ];

        // Only update SMS settings if they were provided (not masked)
        if ($request->has('sms_provider') && $request->filled('sms_provider')) {
            $envUpdates['SMS_PROVIDER'] = $request->sms_provider;
        }
        if ($request->has('sms_enabled')) {
            $envUpdates['SMS_ENABLED'] = $request->boolean('sms_enabled') ? 'true' : 'false';
        }

        // Termii
        if ($request->has('termii_api_key') && $request->filled('termii_api_key') && !str_contains($request->termii_api_key, '****')) {
            $envUpdates['TERMII_API_KEY'] = $request->termii_api_key;
        }

        // Africa's Talking
        if ($request->has('at_username')) {
            $envUpdates['AT_USERNAME'] = $request->at_username ?? '';
        }
        if ($request->has('at_api_key') && $request->filled('at_api_key') && !str_contains($request->at_api_key, '****')) {
            $envUpdates['AT_API_KEY'] = $request->at_api_key;
        }

        $this->updateEnvFile($envUpdates);

        // Store SMS sender preferences in institution settings (DB, not .env)
        $institution = auth()->user()->institution;
        $instSettings = $institution->settings ?? [];

        if ($request->has('sms_enabled')) {
            $instSettings['sms_enabled'] = $request->boolean('sms_enabled');
        }
        if ($request->has('termii_sender_id')) {
            $instSettings['termii_sender_id'] = $request->termii_sender_id;
        }
        if ($request->has('at_from')) {
            $instSettings['at_from'] = $request->at_from;
        }

        $institution->update(['settings' => $instSettings]);

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
