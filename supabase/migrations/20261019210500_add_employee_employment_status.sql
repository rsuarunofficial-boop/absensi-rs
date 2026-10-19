alter table public.employee_profiles
  add column if not exists employment_status text not null default 'aktif';

alter table public.employee_profiles
  drop constraint if exists employee_profiles_employment_status_check;

alter table public.employee_profiles
  add constraint employee_profiles_employment_status_check
  check (
    employment_status in ('aktif', 'nonaktif', 'suspend', 'cuti', 'kontrak')
  );

grant update (employment_status, unit_id, department)
  on public.employee_profiles to authenticated;
