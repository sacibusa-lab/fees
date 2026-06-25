<?php

namespace App\Http\Controllers;

use App\Models\Alumnus;
use App\Models\Student;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AlumniController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $alumni = Alumnus::where('institution_id', $institutionId)
            ->with('lastClass')
            ->latest('graduated_at')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'admission_number' => $a->admission_number,
                'gender' => $a->gender,
                'email' => $a->email,
                'phone' => $a->phone,
                'last_class' => $a->lastClass?->name ?? 'N/A',
                'graduation_year' => $a->graduation_year,
                'graduation_term' => $a->graduation_term ?? 'N/A',
                'graduated_at' => $a->graduated_at->format('M d, Y'),
                'notes' => $a->notes,
            ]);

        $stats = [
            'total_alumni' => $alumni->count(),
            'this_year' => Alumnus::where('institution_id', $institutionId)
                ->where('graduation_year', now()->format('Y'))->count(),
            'by_gender' => [
                'male' => Alumnus::where('institution_id', $institutionId)
                    ->where('gender', 'male')->count(),
                'female' => Alumnus::where('institution_id', $institutionId)
                    ->where('gender', 'female')->count(),
            ],
        ];

        return Inertia::render('Alumni', [
            'alumni' => $alumni,
            'stats' => $stats,
        ]);
    }

    public function restore($id)
    {
        $institutionId = auth()->user()->institution_id;

        $alumnus = Alumnus::where('institution_id', $institutionId)->findOrFail($id);

        DB::transaction(function () use ($alumnus, $institutionId) {
            // Re-create student record
            Student::create([
                'institution_id' => $institutionId,
                'class_id' => $alumnus->last_class_id,
                'admission_number' => $alumnus->admission_number,
                'name' => $alumnus->name,
                'gender' => $alumnus->gender,
                'email' => $alumnus->email,
                'phone' => $alumnus->phone,
                'payment_status' => 'pending',
            ]);

            $alumnus->delete();
        });

        return redirect()->back()->with('success', 'Alumnus restored as active student.');
    }

    public function destroy($id)
    {
        $institutionId = auth()->user()->institution_id;
        $alumnus = Alumnus::where('institution_id', $institutionId)->findOrFail($id);
        $alumnus->delete();

        return redirect()->back()->with('success', 'Alumni record permanently deleted.');
    }
}
