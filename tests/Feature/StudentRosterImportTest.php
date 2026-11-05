<?php

namespace Tests\Feature;

use App\Models\Institution;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\SubClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xls;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class StudentRosterImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_roster_moves_existing_student_to_the_uploaded_class_and_arm(): void
    {
        [$user, $institution, $classes, $arms] = $this->createSchoolSetup();
        $student = $this->createStudent($institution, $classes['JSS 2'], $arms['A']);
        $studentTwo = $this->createStudent($institution, $classes['JSS 1'], $arms['B'], 'ADM-002', 'Student Two');

        $this->actingAs($user)
            ->from('/students')
            ->post('/students/import', [
                'file' => UploadedFile::fake()->createWithContent(
                    'roster.csv',
                    "Full Name,Admission Number,Class,Arm,Gender (Male/Female)\n".
                    "Student One,ADM-001,JSS 1,B,Female\n".
                    "Student Two,ADM-002,JSS 2,A,Male\n"
                ),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/students');

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'class_id' => $classes['JSS 1']->id,
            'sub_class_id' => $arms['B']->id,
        ]);
        $this->assertDatabaseHas('students', [
            'id' => $studentTwo->id,
            'class_id' => $classes['JSS 2']->id,
            'sub_class_id' => $arms['A']->id,
        ]);
    }

    public function test_excel_rosters_move_existing_student_to_the_uploaded_class_and_arm(): void
    {
        [$user, $institution, $classes, $arms] = $this->createSchoolSetup();
        $student = $this->createStudent($institution, $classes['JSS 2'], $arms['A']);

        $legacySpreadsheet = new Spreadsheet;
        $legacySpreadsheet->getActiveSheet()->fromArray([
            ['Full Name', 'Admission Number', 'Class', 'Arm'],
            ['Student One', 'ADM-001', 'JSS 1', 'A'],
        ]);
        $legacyPath = tempnam(sys_get_temp_dir(), 'student-roster-');
        (new Xls($legacySpreadsheet))->save($legacyPath);
        $legacyFile = UploadedFile::fake()->createWithContent('roster.xls', file_get_contents($legacyPath));
        unlink($legacyPath);

        $this->actingAs($user)
            ->from('/students')
            ->post('/students/import', ['file' => $legacyFile])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/students');

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'class_id' => $classes['JSS 1']->id,
            'sub_class_id' => $arms['A']->id,
        ]);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->fromArray([
            ['Full Name', 'Admission Number', 'Class', 'Arm'],
            ['Student One', 'ADM-001', 'JSS 1', 'B'],
        ]);
        $path = tempnam(sys_get_temp_dir(), 'student-roster-');
        (new Xlsx($spreadsheet))->save($path);
        $file = UploadedFile::fake()->createWithContent('roster.xlsx', file_get_contents($path));
        unlink($path);

        $this->actingAs($user)
            ->from('/students')
            ->post('/students/import', ['file' => $file])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/students');

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'class_id' => $classes['JSS 1']->id,
            'sub_class_id' => $arms['B']->id,
        ]);
    }

    private function createSchoolSetup(): array
    {
        $institution = Institution::create([
            'name' => 'Test School',
            'portal_id' => 'test-school',
        ]);
        $role = Role::create([
            'name' => 'Administrator',
            'slug' => 'administrator',
            'is_super_admin' => true,
        ]);
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'admin@example.test',
            'phone' => '08000000001',
            'password' => 'password',
            'institution_id' => $institution->id,
            'role_id' => $role->id,
        ]);
        $classes = [
            'JSS 1' => SchoolClass::create(['institution_id' => $institution->id, 'name' => 'JSS 1']),
            'JSS 2' => SchoolClass::create(['institution_id' => $institution->id, 'name' => 'JSS 2']),
        ];
        $arms = [
            'A' => SubClass::create(['institution_id' => $institution->id, 'name' => 'A']),
            'B' => SubClass::create(['institution_id' => $institution->id, 'name' => 'B']),
        ];

        return [$user, $institution, $classes, $arms];
    }

    private function createStudent(
        Institution $institution,
        SchoolClass $schoolClass,
        SubClass $subClass,
        string $admissionNumber = 'ADM-001',
        string $name = 'Student One'
    ): Student {
        return Student::create([
            'institution_id' => $institution->id,
            'class_id' => $schoolClass->id,
            'sub_class_id' => $subClass->id,
            'admission_number' => $admissionNumber,
            'name' => $name,
            'gender' => 'Male',
            'payment_status' => 'paid',
            'status' => 'active',
        ]);
    }
}
