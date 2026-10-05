import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiMessageSquare, FiPhoneCall } from "react-icons/fi";
import { enquiryService } from "../services";
import { useAuth } from "../context/AuthContext";
import type { Listing } from "../types";
import { telLink, whatsAppLink } from "../utils/format";

interface ContactButtonsProps {
  listing: Listing;
  /** Prefer the explicit listing contact, fall back to the seller's phone. */
  phone?: string;
}

/**
 * Call / WhatsApp buttons. Clicking logs an Enquiry on the backend (so sellers
 * see buyer intent) — this is fire-and-forget and never blocks the user.
 */
export default function ContactButtons({
  listing,
  phone,
}: ContactButtonsProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logged, setLogged] = useState(false);

  const sellerPhone =
    phone ||
    listing.phone ||
    (typeof listing.seller === "object" ? listing.seller.phone : "");
  const waNumber = listing.whatsapp || sellerPhone;

  const goToLogin = () => {
    navigate("/login", { state: { from: `/listings/${listing._id}` } });
  };

  const logEnquiry = (method: "CALL" | "WHATSAPP") => {
    // Guests are sent to login first; enquiry recording requires a user token.
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    if (!logged) {
      setLogged(true);
      void enquiryService.create(listing._id, method).catch(() => {
        setLogged(false);
      });
    }
  };

  const message = t("listing.whatsappMessage", { title: listing.title });

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="btn-primary w-full text-base"
          onClick={goToLogin}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <FiPhoneCall />
            {t("listing.callSeller")}
          </span>
        </button>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1eb755]"
          onClick={goToLogin}
        >
          <FiMessageSquare />
          {t("listing.whatsappSeller")}
        </button>

        <p className="text-center text-xs text-neutral-500">
          <Link
            to="/login"
            className="font-semibold text-brand-700 hover:underline"
          >
            {t("nav.login")}
          </Link>{" "}
          · {t("common.loginRequired")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <a
        href={telLink(sellerPhone)}
        className="btn-primary w-full text-base"
        onClick={() => logEnquiry("CALL")}
        rel="nofollow"
      >
        <span className="inline-flex items-center justify-center gap-2">
          <FiPhoneCall />
          {t("listing.callSeller")}
        </span>
      </a>

      <a
        href={whatsAppLink(waNumber, message)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1eb755]"
        onClick={() => logEnquiry("WHATSAPP")}
      >
        <FiMessageSquare />
        {t("listing.whatsappSeller")}
      </a>
    </div>
  );
}
