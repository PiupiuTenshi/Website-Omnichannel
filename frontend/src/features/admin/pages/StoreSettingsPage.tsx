import { useAuth } from "../../auth";
import { useStoreSettings } from "../hooks/useStoreSettings";
import "./StoreSettingsPage.css";

export function StoreSettingsPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";
  const {
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
  } = useStoreSettings(accessToken);

  if (session === null) {
    return null;
  }

  return (
    <section className="store-settings-page app-container" aria-labelledby="store-settings-heading">
      <div className="store-settings-page__card">
        <header className="store-settings-page__header">
          <h1 className="store-settings-page__title" id="store-settings-heading">Store settings</h1>
          <p className="store-settings-page__description">Manage public contact details and online ordering availability.</p>
        </header>
        {isLoading ? <p role="status">Loading store settings…</p> : (
          <form className="store-settings-form" onSubmit={(event) => { event.preventDefault(); void save(); }} noValidate>
            <label className="store-settings-form__field" htmlFor="store-name">
              <span>Store name</span>
              <input className="store-settings-form__input" id="store-name" value={draft.name} onChange={(event) => changeField("name", event.target.value)} />
            </label>
            <label className="store-settings-form__field" htmlFor="store-email">
              <span>Store email</span>
              <input className="store-settings-form__input" id="store-email" type="email" value={draft.email} onChange={(event) => changeField("email", event.target.value)} />
            </label>
            <label className="store-settings-form__field store-settings-form__field--wide" htmlFor="store-address">
              <span>Address</span>
              <input className="store-settings-form__input" id="store-address" value={draft.address} onChange={(event) => changeField("address", event.target.value)} />
            </label>
            <fieldset className="store-settings-form__hotlines">
              <legend>Hotlines</legend>
              {draft.contactNumbers.map((contactNumber, index) => (
                <div className="store-settings-form__hotline-row" key={index}>
                  <label className="store-settings-form__field" htmlFor={`store-hotline-${index}`}>
                    <span className="sr-only">Hotline {index + 1}</span>
                    <input className="store-settings-form__input" id={`store-hotline-${index}`} type="tel" value={contactNumber} onChange={(event) => changeContactNumber(index, event.target.value.replace(/[^0-9+\-\s()]/g, ''))} />
                  </label>
                  <button className="store-settings-form__button store-settings-form__button--danger" type="button" onClick={() => removeContactNumber(index)} disabled={draft.contactNumbers.length === 1}>Remove</button>
                </div>
              ))}
              <button className="store-settings-form__button store-settings-form__button--secondary" type="button" onClick={addContactNumber}>Add hotline</button>
            </fieldset>
            <label className="store-settings-form__toggle">
              <input type="checkbox" checked={draft.isOnlineOrderingEnabled} onChange={(event) => changeField("isOnlineOrderingEnabled", event.target.checked)} />
              <span>Enable online ordering</span>
            </label>
            {errorMessage && <p className="store-settings-form__notice store-settings-form__notice--error" role="alert">{errorMessage}</p>}
            {successMessage && <p className="store-settings-form__notice store-settings-form__notice--success" role="status">{successMessage}</p>}
            <div className="store-settings-form__actions">
              <button className="store-settings-form__button" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save settings"}</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
