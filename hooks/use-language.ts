"use client";
import { useEffect, useState } from "react";

export type Language = "en" | "bn";

export const translations = {
  en: {
    home: "Home",
    blog: "Blog",
    combos: "Combos",
    offers: "Offers",
    shop: "Shop",
    manageAccount: "Manage account",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    logout: "Log out",
    language: "Language",
    english: "English",
    bangla: "Bangla (বাংলা)",
    selectLanguage: "Select Language",
    signIn: "Sign In",
    account: "Account",
    searchPlaceholder: "Search products...",
    wishlist: "Wishlist",
    cart: "Cart",
    featuredProducts: "Featured Products",
    viewAll: "View All",
    customerReviews: "Customer Reviews",
    noReviewsYet: "No reviews yet.",
    buyNow: "Order Now",
    addToCart: "Add to Cart",
    placeOrder: "Place Order",
    confirmAndPay: "Confirm & Pay",
    selectOption: "Select Option",
    outOfStock: "Out of Stock",
    phoneOrder: "Phone Call Order",
    whatsappOrder: "WhatsApp Order",
    yourCart: "Your Cart",
    subtotal: "Subtotal",
    total: "Total",
    proceedToCheckout: "Proceed to Checkout",
    cartEmptyTitle: "Your cart is empty",
    cartEmptyDesc: "Looks like you haven't added any products to your cart yet.",
    startShopping: "Start Shopping",
    deliveryTitle: "Delivery",
    deliveryDesc: "Tell us where to send your order.",
    fullNameLabel: "Full Name",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Full Address",
    notesLabel: "Order Notes",
    deliveryZoneLabel: "Delivery Zone",
    insideDhaka: "Inside Dhaka",
    outsideDhaka: "Outside Dhaka",
    paymentTitle: "Payment",
    paymentDesc: "Choose how you want to pay.",
    cardPayment: "Card Payment",
    cashOnDelivery: "Cash on Delivery",
    cardNumberLabel: "Card Number",
    cardholderNameLabel: "Cardholder Name",
    expiryLabel: "Expiry",
    cvvLabel: "CVV",
    fullNamePlaceholder: "John Doe",
    phonePlaceholder: "01XXXXXXXXX",
    emailPlaceholder: "your@email.com",
    addressPlaceholder: "House/Flat, Road, Area, District, City",
    notesPlaceholder: "Special instructions...",
    orderSummary: "Order Summary",
    shipping: "Shipping",
    shippingAndDelivery: "Shipping & Delivery",
    oneDayDelivery: "1 Day Delivery",
    threeToFourDaysDelivery: "3-4 Days Delivery",
    shippingCost: "Shipping Cost",
    estDelivery: "Est. Delivery",
    qty: "Qty",
    thankYou: "Thank You!",
    orderSuccessDesc: "Your order has been placed successfully. We are preparing your package.",
    trackPhone: "Track with phone:",
    trackMyOrder: "Track Order",
    continueShopping: "Continue Shopping",
    downloadInvoice: "Download Invoice",
    trackYourOrder: "Track Your Order",
    trackYourOrderDesc: "Enter the phone number you used when placing your order",
    search: "Search",
    searching: "Searching...",
    noOrdersFound: "No orders found for this phone number.",
    orderNumberLabel2: "Order Number:",
    orderIn: "Order in",
    toGet: "to get",
    sameDayShipment: "next day delivery",
    shipmentTomorrow: "delivery day after tomorrow",
    hour: "Hour",
    min: "Min",
    sec: "Sec",
    errorFullNameRequired: "Full name is required",
    errorPhoneRequired: "Phone number is required",
    errorInvalidEmail: "Invalid email",
    errorAddressRequired: "Address is required",
    errorSelectZone: "Please select a delivery zone",
    errorCardNumberLength: "Card number must be 16 digits",
    errorExpiryFormat: "Invalid expiry format (MM/YY)",
    errorCardExpired: "Card has expired",
    errorCvvLength: "CVV must be 3 digits",
    errorNameOnCardRequired: "Name on card is required",
    errorAgreeToTerms: "You must agree to the terms",
    seoAboutHeading: "Premium Comforter & Bed Sheet Sets in Bangladesh",
    seoAboutPara1:
      "Sleep Sheet is an online bedding store in Bangladesh offering premium-quality comforters and bed sheets made from 100% twill cotton fabric. Our 5-piece comforter sets come with a matching bed sheet, pillow covers, and kolbalish cover — a complete bedroom makeover in one package.",
    seoAboutPara2:
      "Order with zero advance payment and pay cash on delivery anywhere in Bangladesh. Every product ships with a 7-day replacement guarantee, so you can shop with complete confidence.",
    seoBrowseComforters: "Browse Comforters",
    seoBrowseBedSheets: "Shop Bed Sheets",
    seoFaqHeading: "Frequently Asked Questions",
    faqQ1: "What is included in the Sleep Sheet 5-piece comforter set?",
    faqA1:
      "Each 5-piece comforter set includes 1 comforter, 1 bed sheet, 2 pillow covers, and 1 kolbalish (bolster) cover, made from premium twill cotton fabric.",
    faqQ2: "Do you offer cash on delivery in Bangladesh?",
    faqA2:
      "Yes. You can order any comforter or bed sheet with zero advance payment and pay in cash when the product is delivered to your home, anywhere in Bangladesh.",
    faqQ3: "How long does delivery take?",
    faqA3:
      "Delivery inside Dhaka takes 1 day (৳80 delivery charge). Outside Dhaka, delivery takes 3-4 days (৳150 delivery charge).",
    faqQ4: "Is there a replacement guarantee?",
    faqA4:
      "Yes, every Sleep Sheet product comes with a 7-day replacement guarantee. If there is any defect, we will replace the product free of charge.",
  },
  bn: {
    home: "হোম",
    blog: "ব্লগ",
    combos: "কম্বো",
    offers: "অফার",
    shop: "শপ",
    manageAccount: "অ্যাকাউন্ট পরিচালনা",
    lightMode: "লাইট মোড",
    darkMode: "ডার্ক মোড",
    logout: "লগ আউট",
    language: "ভাষা",
    english: "English",
    bangla: "বাংলা (BN)",
    selectLanguage: "ভাষা নির্বাচন করুন",
    signIn: "লগ ইন",
    account: "অ্যাকাউন্ট",
    searchPlaceholder: "পণ্য খুঁজুন...",
    wishlist: "পছন্দ তালিকা",
    cart: "কার্ট",
    featuredProducts: "বিশেষায়িত পণ্যসমূহ",
    viewAll: "সব দেখুন",
    customerReviews: "ক্রেতাদের মতামত",
    noReviewsYet: "এখনও কোন রিভিউ নেই।",
    buyNow: "অর্ডার করুন",
    addToCart: "কার্টে যোগ করুন",
    placeOrder: "অর্ডার কনফার্ম করুন",
    confirmAndPay: "নিশ্চিত ও পরিশোধ করুন",
    selectOption: "অপশন সিলেক্ট করুন",
    outOfStock: "স্টক আউট",
    phoneOrder: "ফোনে অর্ডার করুন",
    whatsappOrder: "হোয়াটসঅ্যাপে অর্ডার",
    yourCart: "আপনার কার্ট",
    subtotal: "সাবটোটাল",
    total: "সর্বমোট",
    proceedToCheckout: "অর্ডার সম্পন্ন করুন",
    cartEmptyTitle: "আপনার কার্টটি খালি",
    cartEmptyDesc: "মনে হচ্ছে আপনি এখনও আপনার কার্টে কোনো পণ্য যোগ করেননি।",
    startShopping: "কেনাকাটা শুরু করুন",
    deliveryTitle: "ডেলিভারি",
    deliveryDesc: "আপনার অর্ডার কোথায় পাঠাতে হবে তা আমাদের জানান।",
    fullNameLabel: "নাম",
    phoneLabel: "ফোন নম্বর",
    emailLabel: "ইমেইল (ঐচ্ছিক)",
    addressLabel: "ঠিকানা",
    notesLabel: "অর্ডার নোট (ঐচ্ছিক)",
    deliveryZoneLabel: "ডেলিভারি জোন",
    insideDhaka: "ঢাকার ভেতরে",
    outsideDhaka: "ঢাকার বাইরে",
    paymentTitle: "পেমেন্ট",
    paymentDesc: "আপনি কিভাবে পেমেন্ট করতে চান তা নির্বাচন করুন।",
    cardPayment: "কার্ড পেমেন্ট",
    cashOnDelivery: "ক্যাশ অন ডেলিভারি",
    cardNumberLabel: "কার্ড নম্বর",
    cardholderNameLabel: "কার্ড হোল্ডার এর নাম",
    expiryLabel: "মেয়াদ",
    cvvLabel: "সিভিভি (CVV)",
    fullNamePlaceholder: "আপনার নাম লিখুন",
    phonePlaceholder: "০১XXXXXXXXX",
    emailPlaceholder: "your@email.com",
    addressPlaceholder: "বাসা/ফ্ল্যাট নম্বর, রাস্তা, এলাকা, জেলা ও শহর",
    notesPlaceholder: "বিশেষ নির্দেশনা থাকলে লিখুন...",
    orderSummary: "অর্ডারের বিবরণ",
    shipping: "ডেলিভারি",
    shippingAndDelivery: "ডেলিভারি ও শিপিং",
    oneDayDelivery: "১ দিনে ডেলিভারি",
    threeToFourDaysDelivery: "৩-৪ দিনে ডেলিভারি",
    shippingCost: "ডেলিভারি চার্জ",
    estDelivery: "সম্ভাব্য ডেলিভারি",
    qty: "পরিমাণ",
    thankYou: "ধন্যবাদ!",
    orderSuccessDesc: "আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে। আমরা আপনার পার্সেলটি প্রস্তুত করছি।",
    trackPhone: "ফোন নম্বর দিয়ে ট্র্যাক করুন:",
    trackMyOrder: "অর্ডার ট্র্যাক করুন",
    continueShopping: "কেনাকাটা চালিয়ে যান",
    downloadInvoice: "ইনভয়েস ডাউনলোড করুন",
    trackYourOrder: "আপনার অর্ডার ট্র্যাক করুন",
    trackYourOrderDesc: "অর্ডার করার সময় আপনি যে ফোন নম্বরটি ব্যবহার করেছিলেন তা লিখুন",
    search: "অনুসন্ধান করুন",
    searching: "অনুসন্ধান করা হচ্ছে...",
    noOrdersFound: "এই ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি।",
    orderNumberLabel2: "অর্ডার নম্বর:",
    orderIn: "আর মাত্র",
    toGet: "এর মধ্যে অর্ডার করলেই পাচ্ছেন",
    sameDayShipment: "আগামীকাল ডেলিভারি",
    shipmentTomorrow: "আগামীপরশু ডেলিভারি",
    hour: "ঘণ্টা",
    min: "মিনিট",
    sec: "সেকেন্ড",
    errorFullNameRequired: "নাম আবশ্যক",
    errorPhoneRequired: "ফোন নম্বর আবশ্যক",
    errorInvalidEmail: "সঠিক ইমেইল দিন",
    errorAddressRequired: "ঠিকানা আবশ্যক",
    errorSelectZone: "একটি ডেলিভারি জোন নির্বাচন করুন",
    errorCardNumberLength: "কার্ড নম্বর অবশ্যই ১৬ ডিজিটের হতে হবে",
    errorExpiryFormat: "মেয়াদ সঠিক ফরম্যাটে দিন (MM/YY)",
    errorCardExpired: "কার্ডের মেয়াদ শেষ হয়ে গেছে",
    errorCvvLength: "সিভিভি (CVV) অবশ্যই ৩ ডিজিটের হতে হবে",
    errorNameOnCardRequired: "কার্ডে থাকা নাম আবশ্যক",
    errorAgreeToTerms: "শর্তাবলীতে সম্মত হওয়া আবশ্যক",
    seoAboutHeading: "বাংলাদেশে প্রিমিয়াম কমফোর্টার ও বেডশীট সেট",
    seoAboutPara1:
      "স্লিপ শীট বাংলাদেশের একটি অনলাইন বেডিং স্টোর, যেখানে ১০০% টুইল কটন ফেব্রিকে তৈরি প্রিমিয়াম মানের কমফোর্টার ও বেডশীট পাওয়া যায়। আমাদের ৫ পিস কমফোর্টার সেটে থাকছে ম্যাচিং বেডশীট, বালিশের কভার এবং কোলবালিশ কভার — এক প্যাকেজেই সম্পূর্ণ বেডরুম মেকওভার।",
    seoAboutPara2:
      "শূন্য অগ্রিম পেমেন্টে অর্ডার করুন এবং বাংলাদেশের যেকোনো জায়গায় ক্যাশ অন ডেলিভারিতে মূল্য পরিশোধ করুন। প্রতিটি পণ্যে রয়েছে ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি, তাই নিশ্চিন্তে কেনাকাটা করুন।",
    seoBrowseComforters: "কমফোর্টার দেখুন",
    seoBrowseBedSheets: "বেডশীট কিনুন",
    seoFaqHeading: "সচরাচর জিজ্ঞাসিত প্রশ্ন",
    faqQ1: "স্লিপ শীট ৫ পিস কমফোর্টার সেটে কী কী থাকে?",
    faqA1:
      "প্রতিটি ৫ পিস কমফোর্টার সেটে থাকছে ১টি কমফোর্টার, ১টি বেডশীট, ২টি বালিশের কভার এবং ১টি কোলবালিশ কভার, যা প্রিমিয়াম টুইল কটন ফেব্রিকে তৈরি।",
    faqQ2: "আপনারা কি বাংলাদেশে ক্যাশ অন ডেলিভারি দিচ্ছেন?",
    faqA2:
      "হ্যাঁ। আপনি যেকোনো কমফোর্টার বা বেডশীট শূন্য অগ্রিম পেমেন্টে অর্ডার করতে পারবেন এবং বাংলাদেশের যেকোনো জায়গায় পণ্য হাতে পেয়ে ক্যাশে মূল্য পরিশোধ করতে পারবেন।",
    faqQ3: "ডেলিভারি হতে কত সময় লাগে?",
    faqA3:
      "ঢাকার ভেতরে ডেলিভারি হতে ১ দিন সময় লাগে (ডেলিভারি চার্জ ৳৮০)। ঢাকার বাইরে ডেলিভারি হতে ৩-৪ দিন সময় লাগে (ডেলিভারি চার্জ ৳১৫০)।",
    faqQ4: "রিপ্লেসমেন্ট গ্যারান্টি আছে কি?",
    faqA4:
      "হ্যাঁ, প্রতিটি স্লিপ শীট পণ্যে রয়েছে ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি। কোনো ত্রুটি থাকলে আমরা বিনামূল্যে পণ্য পরিবর্তন করে দেব।",
  },
};

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("bn");

  useEffect(() => {
    // Read initial value from localStorage
    const saved = localStorage.getItem("language") as Language;
    if (saved === "en" || saved === "bn") {
      setLanguageState(saved);
    } else {
      // Default to 'bn'
      localStorage.setItem("language", "bn");
      setLanguageState("bn");
    }

    const handleLangChange = () => {
      const current = localStorage.getItem("language") as Language;
      if (current === "en" || current === "bn") {
        setLanguageState(current);
      }
    };

    window.addEventListener("language-change", handleLangChange);
    return () => window.removeEventListener("language-change", handleLangChange);
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    setLanguageState(lang);
    window.dispatchEvent(new Event("language-change"));
  };

  const t = (key: keyof typeof translations["en"]) => {
    return translations[language][key] || translations["bn"][key] || key;
  };

  return { language, setLanguage, t };
}
