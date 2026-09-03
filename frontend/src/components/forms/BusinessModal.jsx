import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { INDUSTRIES, BUSINESS_TYPES, POLLUTION_CATEGORIES } from '../../utils/constants';
import { useBusiness } from '../../context/BusinessContext';
import { Building2, MapPin, DollarSign, Users } from 'lucide-react';

export function BusinessModal({ isOpen, onClose, onSuccess }) {
  const { createBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    industry: 'Manufacturing',
    location: '',
    business_type: 'Private Limited Company',
    investment: '',
    employees: '',
    pollution_category: 'Orange',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Business name is required';
    if (!form.industry) errs.industry = 'Please select an industry';
    if (!form.location.trim()) errs.location = 'Location / Jurisdiction is required';
    if (!form.business_type) errs.business_type = 'Business structure is required';
    if (!form.investment || Number(form.investment) <= 0)
      errs.investment = 'Valid capital investment is required';
    if (!form.employees || Number(form.employees) <= 0)
      errs.employees = 'Number of employees is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry,
        location: form.location.trim(),
        business_type: form.business_type,
        investment: parseFloat(form.investment),
        employees: parseInt(form.employees, 10),
        pollution_category: form.pollution_category,
      };

      const result = await createBusiness(payload);
      setForm({
        name: '',
        industry: 'Manufacturing',
        location: '',
        business_type: 'Private Limited Company',
        investment: '',
        employees: '',
        pollution_category: 'Orange',
      });
      setErrors({});
      onClose();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Failed to create business:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Enterprise Entity"
      description="Provide enterprise parameters to derive statutory approval requirements and clearance roadmaps."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Enterprise / Legal Entity Name"
          placeholder="e.g. Apex Industrial Solutions Ltd."
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
            label="Legal Form"
            options={BUSINESS_TYPES}
            required
            value={form.business_type}
            onChange={(e) => setForm({ ...form, business_type: e.target.value })}
            error={errors.business_type}
          />
        </div>

        <Input
          label="Location / Operating Jurisdiction"
          placeholder="e.g. Sanand Industrial Estate, Gujarat"
          leftIcon={MapPin}
          required
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          error={errors.location}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Capital Investment (INR)"
            type="number"
            placeholder="e.g. 50000000"
            leftIcon={DollarSign}
            required
            value={form.investment}
            onChange={(e) => setForm({ ...form, investment: e.target.value })}
            error={errors.investment}
          />

          <Input
            label="Workforce Size (Employees)"
            type="number"
            placeholder="e.g. 85"
            leftIcon={Users}
            required
            value={form.employees}
            onChange={(e) => setForm({ ...form, employees: e.target.value })}
            error={errors.employees}
          />
        </div>

        <Select
          label="Pollution Category"
          options={POLLUTION_CATEGORIES}
          value={form.pollution_category}
          onChange={(e) => setForm({ ...form, pollution_category: e.target.value })}
          helperText="Determines mandatory environmental consent clearances."
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E7]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Register Enterprise Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
}
