import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { businessService } from '../services/businessService';
import { useNotification } from './NotificationContext';

const BusinessContext = createContext();

const ACTIVE_BUSINESS_KEY = 'bizclear_active_business_id';

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();

  const loadBusinesses = useCallback(async (selectId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await businessService.getBusinesses();
      const list = Array.isArray(data) ? data : [];
      setBusinesses(list);

      if (list.length > 0) {
        const savedId = selectId || Number(localStorage.getItem(ACTIVE_BUSINESS_KEY));
        const matched = list.find((b) => b.id === savedId) || list[0];
        setActiveBusiness(matched);
        localStorage.setItem(ACTIVE_BUSINESS_KEY, String(matched.id));
      } else {
        setActiveBusiness(null);
      }
    } catch (err) {
      console.error('Failed to load businesses from backend:', err);
      setError(err.message || 'Could not fetch businesses from backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const selectBusiness = (businessOrId) => {
    if (!businessOrId) {
      setActiveBusiness(null);
      localStorage.removeItem(ACTIVE_BUSINESS_KEY);
      return;
    }

    const business =
      typeof businessOrId === 'object'
        ? businessOrId
        : businesses.find((b) => b.id === Number(businessOrId));

    if (business) {
      setActiveBusiness(business);
      localStorage.setItem(ACTIVE_BUSINESS_KEY, String(business.id));
    }
  };

  const createBusiness = async (formData) => {
    try {
      const response = await businessService.createBusiness(formData);
      showSuccess(`Business "${formData.name}" created successfully!`, 'Registration Complete');
      await loadBusinesses(response.business_id);
      return response;
    } catch (err) {
      showError(err.message || 'Failed to create business', 'Registration Failed');
      throw err;
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        loading,
        error,
        selectBusiness,
        createBusiness,
        refreshBusinesses: loadBusinesses,
        hasBusinesses: businesses.length > 0,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
