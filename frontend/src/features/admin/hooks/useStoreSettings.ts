import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/apiClient";
import { getStoreSettings, updateStoreSettings } from "../api/storeSettingsApi";
import type { StoreSettings, StoreSettingsDraft } from "../types/storeSettingsTypes";

const EMPTY_DRAFT: StoreSettingsDraft = {
  name: "",
  email: "",
  address: "",
  isOnlineOrderingEnabled: true,
  contactNumbers: [""],
  rowVersion: ""
};

export function useStoreSettings(accessToken: string) {
  const [draft, setDraft] = useState<StoreSettingsDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const settings = await getStoreSettings(accessToken);
      setDraft(toDraft(settings));
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setDraft(EMPTY_DRAFT);
        setSuccessMessage("Store settings have not been created yet. Complete the form to initialize them.");
      } else {
        setErrorMessage(error instanceof ApiError ? error.message : "Unable to load store settings.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeField = useCallback(<TField extends keyof StoreSettingsDraft>(field: TField, value: StoreSettingsDraft[TField]) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }, []);

  const changeContactNumber = useCallback((index: number, value: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contactNumbers: currentDraft.contactNumbers.map((contactNumber, contactIndex) => contactIndex === index ? value : contactNumber)
    }));
  }, []);

  const addContactNumber = useCallback(() => {
    setDraft((currentDraft) => ({ ...currentDraft, contactNumbers: [...currentDraft.contactNumbers, ""] }));
  }, []);

  const removeContactNumber = useCallback((index: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contactNumbers: currentDraft.contactNumbers.filter((_, contactIndex) => contactIndex !== index)
    }));
  }, []);

  const save = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!draft.name.trim() || !draft.address.trim() || draft.contactNumbers.some((number) => !number.trim())) {
      setErrorMessage("Enter a store name, address, and at least one complete hotline.");
      return;
    }

    setIsSaving(true);
    try {
      const settings = await updateStoreSettings(accessToken, {
        ...draft,
        name: draft.name.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        contactNumbers: draft.contactNumbers.map((number) => number.trim())
      });
      setDraft(toDraft(settings));
      setSuccessMessage("Store settings saved.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to save store settings.");
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, draft]);

  return {
    draft,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    changeField,
    changeContactNumber,
    addContactNumber,
    removeContactNumber,
    save
  };
}

function toDraft(settings: StoreSettings): StoreSettingsDraft {
  return {
    name: settings.name,
    email: settings.email ?? "",
    address: settings.address,
    isOnlineOrderingEnabled: settings.isOnlineOrderingEnabled,
    contactNumbers: settings.contactNumbers,
    rowVersion: settings.rowVersion
  };
}
