import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  INDUSTRIES,
  SUB_SECTORS,
  STATES,
  TAMIL_NADU_DISTRICTS,
  BUSINESS_ACTIVITIES,
  BUSINESS_TYPES,
  POLLUTION_CATEGORIES,
  LAND_TYPES,
  WASTE_GENERATION_TYPES
} from '../../utils/constants';
import { useBusiness } from '../../context/BusinessContext';
import {
  Building2,
  MapPin,
  IndianRupee,
  Users,
  Factory,
  Flame,
  Globe2,
  ShieldAlert,
  Zap,
  Droplets,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  FileCheck
} from 'lucide-react';

export function BusinessModal({ isOpen, onClose, onSuccess }) {
  const { createBusiness } = useBusiness();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // Step 1: Entity & Location
    name: '',
    industry: 'Manufacturing',
    sub_sector: 'Automotive Components',
    business_type: 'Private Limited Company',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    location: '',

    // Step 2: Scale & Products
    business_activity: 'Manufacturing',
    products: '',
    investment: '',
    employees: '',

    // Step 3: Operational Characteristics & Triggers
    factory: true,
    production_capacity: '',
    land_type: 'Industrial',
    land_area: '',
    building_area: '',

    pollution_category: 'Orange',
    hazardous_materials: false,
    hazardous_details: '',

    water_usage: 'Domestic & Process cooling (5 KLD)',
    waste_generation: 'Solid & Non-hazardous',
    power_requirement: '75 kW',

    import_export: false,
    boiler: false,
    boiler_details: '',
  });

  const [errors, setErrors] = useState({});

  // Dynamically update sub-sector options based on selected industry
  const currentSubSectors = SUB_SECTORS[form.industry] || [
    { value: 'General', label: 'General Sector Operations' }
  ];

  useEffect(() => {
    if (currentSubSectors.length > 0 && !currentSubSectors.some(s => s.value === form.sub_sector)) {
      setForm(prev => ({ ...prev, sub_sector: currentSubSectors[0].value }));
    }
  }, [form.industry]);

  const validateStep = (currentStep) => {
    const errs = {};
    if (currentStep === 1) {
      if (!form.name.trim()) errs.name = 'Enterprise legal entity name is required';
      if (!form.industry) errs.industry = 'Industry sector is required';
      if (!form.business_type) errs.business_type = 'Legal form is required';
      if (!form.state) errs.state = 'Operating state is required';
      if (!form.district) errs.district = 'Operating district is required';
      if (!form.location.trim()) errs.location = 'Operating address / industrial area is required';
    } else if (currentStep === 2) {
      if (!form.investment || Number(form.investment) <= 0)
        errs.investment = 'Valid capital investment amount is required';
      if (!form.employees || Number(form.employees) <= 0)
        errs.employees = 'Total workforce size is required';
      if (!form.business_activity) errs.business_activity = 'Primary business activity is required';
    } else if (currentStep === 3) {
      if (form.hazardous_materials && !form.hazardous_details.trim()) {
        errs.hazardous_details = 'Please specify the hazardous materials or chemicals handled';
      }
      if (form.boiler && !form.boiler_details.trim()) {
        errs.boiler_details = 'Please specify boiler capacity or steam pressure rating';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry,
        sub_sector: form.sub_sector,
        location: form.location.trim(),
        state: form.state,
        district: form.district,
        business_type: form.business_type,
        business_activity: form.business_activity,
        products: form.products.trim() ? form.products.split(',').map(p => p.trim()) : [],
        investment: parseFloat(form.investment),
        employees: parseInt(form.employees, 10),

        factory: Boolean(form.factory),
        production_capacity: form.production_capacity.trim(),
        land_type: form.land_type,
        land_area: form.land_area ? parseFloat(form.land_area) : null,
        building_area: form.building_area ? parseFloat(form.building_area) : null,

        pollution_category: form.pollution_category,
        hazardous_materials: Boolean(form.hazardous_materials),
        hazardous_details: form.hazardous_details.trim(),

        water_usage: form.water_usage.trim(),
        waste_generation: form.waste_generation,
        power_requirement: form.power_requirement.trim(),

        import_export: Boolean(form.import_export),
        boiler: Boolean(form.boiler),
        boiler_details: form.boiler_details.trim(),
      };

      const result = await createBusiness(payload);

      // Reset form & state
      setForm({
        name: '',
        industry: 'Manufacturing',
        sub_sector: 'Automotive Components',
        business_type: 'Private Limited Company',
        state: 'Tamil Nadu',
        district: 'Coimbatore',
        location: '',
        business_activity: 'Manufacturing',
        products: '',
        investment: '',
        employees: '',
        factory: true,
        production_capacity: '',
        land_type: 'Industrial',
        land_area: '',
        building_area: '',
        pollution_category: 'Orange',
        hazardous_materials: false,
        hazardous_details: '',
        water_usage: '',
        waste_generation: 'Solid & Non-hazardous',
        power_requirement: '',
        import_export: false,
        boiler: false,
        boiler_details: '',
      });
      setStep(1);
      setErrors({});
      onClose();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Failed to register enterprise:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Enterprise & Discover Statutory Approvals"
      description="Provide enterprise operational parameters to dynamically derive applicable Central, State, and Local government clearances."
      maxWidth="max-w-3xl"
    >
      {/* Progressive Step Indicator */}
      <div className="mb-6 flex items-center justify-between border-b border-[#E2E8E7] pb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 1 ? 'bg-[#006B68] text-white' : 'bg-[#E2E8E7] text-[#66757A]'
          }`}>
            1
          </div>
          <span className={`text-xs font-semibold ${step === 1 ? 'text-[#006B68]' : 'text-[#66757A]'}`}>
            Entity & Location
          </span>
        </div>

        <div className="h-0.5 w-8 bg-[#E2E8E7] sm:w-16" />

        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 2 ? 'bg-[#006B68] text-white' : 'bg-[#E2E8E7] text-[#66757A]'
          }`}>
            2
          </div>
          <span className={`text-xs font-semibold ${step === 2 ? 'text-[#006B68]' : 'text-[#66757A]'}`}>
            Scale & Products
          </span>
        </div>

        <div className="h-0.5 w-8 bg-[#E2E8E7] sm:w-16" />

        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 3 ? 'bg-[#006B68] text-white' : 'bg-[#E2E8E7] text-[#66757A]'
          }`}>
            3
          </div>
          <span className={`text-xs font-semibold ${step === 3 ? 'text-[#006B68]' : 'text-[#66757A]'}`}>
            Operational Triggers
          </span>
        </div>
      </div>

      <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
        {/* =================================================================== */}
        {/* STEP 1: ENTITY & LOCATION */}
        {/* =================================================================== */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Enterprise / Legal Entity Name"
              placeholder="e.g. Ramraj Precision Components Pvt. Ltd."
              leftIcon={Building2}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Industry Sector"
                options={INDUSTRIES}
                required
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                error={errors.industry}
              />

              <Select
                label="Sub-sector"
                options={currentSubSectors}
                required
                value={form.sub_sector}
                onChange={(e) => setForm({ ...form, sub_sector: e.target.value })}
                error={errors.sub_sector}
                helperText="Enables sector-specific regulatory classification."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Legal Form / Entity Type"
                options={BUSINESS_TYPES}
                required
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                error={errors.business_type}
              />

              <Select
                label="State"
                options={STATES}
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                error={errors.state}
              />

              {form.state === 'Tamil Nadu' ? (
                <Select
                  label="District"
                  options={TAMIL_NADU_DISTRICTS}
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  error={errors.district}
                />
              ) : (
                <Input
                  label="District"
                  placeholder="e.g. Bengaluru Urban"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  error={errors.district}
                />
              )}
            </div>

            <Input
              label="Operating Location / Industrial Area"
              placeholder="e.g. Plot 42, SIPCOT Industrial Park, Coimbatore"
              leftIcon={MapPin}
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              error={errors.location}
              helperText="Specific site jurisdiction used for Local Body & DISH jurisdiction."
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: SCALE, ACTIVITY & PRODUCTS */}
        {/* =================================================================== */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Primary Business Activity"
                options={BUSINESS_ACTIVITIES}
                required
                value={form.business_activity}
                onChange={(e) => setForm({ ...form, business_activity: e.target.value })}
                error={errors.business_activity}
              />

              <Input
                label="Key Products / Services"
                placeholder="e.g. Automobile Gears, CNC Precision Fasteners"
                value={form.products}
                onChange={(e) => setForm({ ...form, products: e.target.value })}
                helperText="Comma-separated product or service descriptions."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Capital Investment (₹ / INR)"
                type="number"
                placeholder="e.g. 50000000"
                leftIcon={IndianRupee}
                required
                value={form.investment}
                onChange={(e) => setForm({ ...form, investment: e.target.value })}
                error={errors.investment}
                helperText="Gross Fixed Assets (GFA) in ₹ determines MSME tier & TNPCB fee schedules."
              />

              <Input
                label="Total Workforce Size (Employees)"
                type="number"
                placeholder="e.g. 100"
                leftIcon={Users}
                required
                value={form.employees}
                onChange={(e) => setForm({ ...form, employees: e.target.value })}
                error={errors.employees}
                helperText="Triggers Factories Act (≥10), EPFO (≥20), ESIC (≥10), Standing Orders (≥50)."
              />
            </div>

            <Select
              label="Environmental / Pollution Category"
              options={POLLUTION_CATEGORIES}
              value={form.pollution_category}
              onChange={(e) => setForm({ ...form, pollution_category: e.target.value })}
              helperText="CPCB/TNPCB categorization determines mandatory CTE & CTO consent permits."
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: OPERATIONAL CHARACTERISTICS & CONDITIONAL TRIGGERS */}
        {/* =================================================================== */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Toggle 1: Factory / Plant */}
            <div className="p-4 rounded-xl border border-[#C5D5D3] bg-[#F8FAF9] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Factory className="w-4 h-4 text-[#006B68]" />
                  <div>
                    <label className="text-sm font-semibold text-[#172126] block">
                      Operates a Manufacturing Factory / Industrial Plant?
                    </label>
                    <p className="text-xs text-[#66757A]">
                      Triggers Factories Act 1948, DISH building plan approval, Fire NOC, and site clearances.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, factory: false })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      !form.factory ? 'bg-[#172126] text-white border-[#172126]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, factory: true })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      form.factory ? 'bg-[#006B68] text-white border-[#006B68]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Conditional Factory Details */}
              {form.factory && (
                <div className="pt-3 border-t border-[#E2E8E7] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
                  <Select
                    label="Land / Estate Type"
                    options={LAND_TYPES}
                    value={form.land_type}
                    onChange={(e) => setForm({ ...form, land_type: e.target.value })}
                  />

                  <Input
                    label="Production Capacity"
                    placeholder="e.g. 50,000 Units / Month"
                    value={form.production_capacity}
                    onChange={(e) => setForm({ ...form, production_capacity: e.target.value })}
                  />

                  <Input
                    label="Connected Power (kW / kVA)"
                    placeholder="e.g. 150 kVA"
                    value={form.power_requirement}
                    onChange={(e) => setForm({ ...form, power_requirement: e.target.value })}
                    helperText="HT / CEIG threshold >= 112 kW"
                  />
                </div>
              )}
            </div>

            {/* Toggle 2: Hazardous Materials */}
            <div className="p-4 rounded-xl border border-[#C5D5D3] bg-[#F8FAF9] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#C93D3D]" />
                  <div>
                    <label className="text-sm font-semibold text-[#172126] block">
                      Handles Hazardous Materials / Solvents / Toxic Chemicals?
                    </label>
                    <p className="text-xs text-[#66757A]">
                      Triggers Hazardous Waste Form 2 Authorization and PESO Storage Licenses.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, hazardous_materials: false })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      !form.hazardous_materials ? 'bg-[#172126] text-white border-[#172126]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, hazardous_materials: true })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      form.hazardous_materials ? 'bg-[#006B68] text-white border-[#006B68]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {form.hazardous_materials && (
                <div className="pt-3 border-t border-[#E2E8E7] animate-in fade-in duration-150">
                  <Input
                    label="Hazardous Material Details / Solvents Handled"
                    placeholder="e.g. Toluene, Isopropanol, Heavy metal electroplating bath (5000 Litres)"
                    required
                    value={form.hazardous_details}
                    onChange={(e) => setForm({ ...form, hazardous_details: e.target.value })}
                    error={errors.hazardous_details}
                  />
                </div>
              )}
            </div>

            {/* Toggle 3: Steam Boiler / Pressure Vessel */}
            <div className="p-4 rounded-xl border border-[#C5D5D3] bg-[#F8FAF9] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-[#B87707]" />
                  <div>
                    <label className="text-sm font-semibold text-[#172126] block">
                      Industrial Steam Boiler or High-Pressure Vessel Installed?
                    </label>
                    <p className="text-xs text-[#66757A]">
                      Triggers Indian Boilers Act 1923 registration and annual inspection certificates.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, boiler: false })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      !form.boiler ? 'bg-[#172126] text-white border-[#172126]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, boiler: true })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      form.boiler ? 'bg-[#006B68] text-white border-[#006B68]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {form.boiler && (
                <div className="pt-3 border-t border-[#E2E8E7] animate-in fade-in duration-150">
                  <Input
                    label="Boiler Rating / Steam Capacity (Tonnes/hr or kg/cm²)"
                    placeholder="e.g. 2 Tonne/hr IBR Steam Boiler, 10.5 kg/cm²"
                    required
                    value={form.boiler_details}
                    onChange={(e) => setForm({ ...form, boiler_details: e.target.value })}
                    error={errors.boiler_details}
                  />
                </div>
              )}
            </div>

            {/* Toggle 4: Import / Export Activity */}
            <div className="p-4 rounded-xl border border-[#C5D5D3] bg-[#F8FAF9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe2 className="w-4 h-4 text-[#006B68]" />
                <div>
                  <label className="text-sm font-semibold text-[#172126] block">
                    International Import or Export Operations?
                  </label>
                  <p className="text-xs text-[#66757A]">
                    Triggers DGFT Importer Exporter Code (IEC) and ICEGATE Port Registrations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, import_export: false })}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    !form.import_export ? 'bg-[#172126] text-white border-[#172126]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, import_export: true })}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    form.import_export ? 'bg-[#006B68] text-white border-[#006B68]' : 'bg-white text-[#4D5C61] border-[#C5D5D3]'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Waste Generation Type"
                options={WASTE_GENERATION_TYPES}
                value={form.waste_generation}
                onChange={(e) => setForm({ ...form, waste_generation: e.target.value })}
              />

              <Input
                label="Water Requirement / Source"
                placeholder="e.g. 10 KLD Ground Water / SIPCOT Supply"
                value={form.water_usage}
                onChange={(e) => setForm({ ...form, water_usage: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E2E8E7]">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              icon={ArrowLeft}
              onClick={handleBack}
            >
              Previous Step
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              variant="primary"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleNext}
            >
              Next Step
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              icon={Sparkles}
              loading={loading}
            >
              Register & Run Discovery Engine
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
