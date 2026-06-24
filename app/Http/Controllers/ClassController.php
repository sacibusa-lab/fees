<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\SubClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;
        $classes = SchoolClass::where('institution_id', $institutionId)->with('category')->get();

        $formattedClasses = $classes->map(function ($class) {
            return [
                'id' => $class->id,
                'name' => $class->name,
                'category_name' => $class->category->name ?? 'N/A',
            ];
        });

        return Inertia::render('Classes', [
            'initialClasses' => $formattedClasses
        ]);
    }

    public function subClasses()
    {
        $institutionId = auth()->user()->institution_id;
        
        // Get all global subclasses for this institution
        $subClasses = SubClass::where('institution_id', $institutionId)
            ->whereNull('class_id')
            ->get();

        $formattedSubClasses = $subClasses->map(function ($subClass) use ($institutionId) {
            // Count students across ALL classes in this institution
            $studentCount = \App\Models\Student::where('institution_id', $institutionId)
                ->where('sub_class_id', $subClass->id)
                ->count();

            return [
                'id' => $subClass->id,
                'name' => $subClass->name,
                'class_name' => 'All Classes', // Global subclass
                'student_count' => $studentCount,
            ];
        });

        return Inertia::render('SubClasses', [
            'initialSubClasses' => $formattedSubClasses
        ]);
    }

    public function store(Request $request)
    {
        $institutionId = auth()->user()->institution_id;
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Check for duplicate subclass name in this institution
        $existing = SubClass::where('institution_id', $institutionId)
            ->whereNull('class_id')
            ->where('name', $validated['name'])
            ->first();

        if ($existing) {
            return redirect()->back()->withErrors(['name' => 'A subclass with this name already exists.']);
        }

        SubClass::create([
            'institution_id' => $institutionId,
            'class_id' => null, // Global subclass
            'name' => $validated['name'],
        ]);

        return redirect()->back()->with('success', 'Sub-class created successfully');
    }

    public function update(Request $request, SchoolClass $schoolClass)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $schoolClass->update([
            'name' => $validated['name']
        ]);

        return redirect()->back()->with('success', 'Class updated successfully');
    }

    public function updateSubClass(Request $request, SubClass $subClass)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $subClass->update([
            'name' => $validated['name']
        ]);

        return redirect()->back()->with('success', 'Sub-class updated successfully');
    }
}
