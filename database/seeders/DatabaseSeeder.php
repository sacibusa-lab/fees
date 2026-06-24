<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Institution;
use App\Models\Session;
use App\Models\ClassCategory;
use App\Models\SchoolClass;
use App\Models\SubClass;
use App\Models\Student;
use App\Models\Fee;
use App\Models\PaymentSummary;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $inst = Institution::create([
            'name' => "St. Augustine's College",
            'portal_id' => 'PGN677',
            'email' => 'admin@staugustine.edu',
            'phone' => '+234-800-000-0000'
        ]);

        User::create([
            'institution_id' => $inst->id,
            'name' => 'Chinweike Nweke',
            'email' => 'admin@staugustine.edu',
            'phone' => '08000000000',
            'pin' => '123456',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);

        $session = Session::create([
            'institution_id' => $inst->id,
            'name' => '2025/2026',
            'is_current' => true
        ]);

        $junior = ClassCategory::create(['institution_id' => $inst->id, 'name' => 'Junior Secondary']);
        $senior = ClassCategory::create(['institution_id' => $inst->id, 'name' => 'Senior Secondary']);

        $jss1 = SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $junior->id, 'name' => 'JSS1']);
        SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $junior->id, 'name' => 'JSS2']);
        SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $junior->id, 'name' => 'JSS3']);
        SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $senior->id, 'name' => 'SS1']);
        SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $senior->id, 'name' => 'SS2']);
        SchoolClass::create(['institution_id' => $inst->id, 'class_category_id' => $senior->id, 'name' => 'SS3']);

        SubClass::create(['class_id' => $jss1->id, 'name' => 'A']);
        SubClass::create(['class_id' => $jss1->id, 'name' => 'B']);
        SubClass::create(['class_id' => $jss1->id, 'name' => 'C']);

        Student::create([
            'institution_id' => $inst->id,
            'class_id' => $jss1->id,
            'sub_class_id' => 1, // Created implicitly by ID, but using 1 for simplicity or fetch first
            'name' => 'Tunde Adebayo',
            'admission_number' => 'STU001',
            'gender' => 'Male',
            'payment_status' => 'paid'
        ]);

        Student::create([
            'institution_id' => $inst->id,
            'class_id' => $jss1->id,
            'sub_class_id' => 1,
            'name' => 'Chioma Okafor',
            'admission_number' => 'STU002',
            'gender' => 'Female',
            'payment_status' => 'partial'
        ]);

        // Create ONLY the specific fee shown in the screenshot to ensure a perfect match
        $fee = Fee::create([
            'institution_id' => $inst->id,
            'session_id' => $session->id,
            'title' => '2nd Term School Fees',
            'revenue_code' => 'FNG7243210',
            'cycle' => 'termly',
            'type' => 'compulsory',
            'payee_allowed' => 'students',
            'amount' => 0,
            'charge_bearer' => 'self',
            'status' => 'active'
        ]);

        // Create a summary for it so Dashboard/Overview works
        PaymentSummary::create([
            'institution_id' => $inst->id,
            'session_id' => $session->id,
            'fee_id' => $fee->id,
            'reserved' => 899,
            'expected' => 899,
            'total_received' => 0,
            'debt' => 899,
            'completed_count' => 0
        ]);
    }
}
