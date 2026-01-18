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
        $subClasses = SubClass::whereHas('schoolClass', function($q) use ($institutionId) {
            $q->where('institution_id', $institutionId);
        })->with('schoolClass')->get();

        $formattedSubClasses = $subClasses->map(function ($subClass) {
            return [
                'id' => $subClass->id,
                'name' => $subClass->name,
                'class_name' => $subClass->schoolClass->name ?? 'N/A',
                'student_count' => $subClass->schoolClass->students()->where('sub_class_id', $subClass->id)->count(),
            ];
        });

        return Inertia::render('SubClasses', [
            'initialSubClasses' => $formattedSubClasses
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string|max:255',
        ]);

        SubClass::create([
            'class_id' => $validated['class_id'],
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
