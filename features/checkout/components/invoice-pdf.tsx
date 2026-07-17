import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { PlacedOrder, ShippingInfo } from "../types";
import { translations } from "@/hooks/use-language";

// Register Hind Siliguri font from Google Fonts GitHub via jsDelivr to support Bangla characters
Font.register({
  family: "Hind Siliguri",
  fonts: [
    { src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-Regular.ttf", fontWeight: "normal" },
    { src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-Bold.ttf", fontWeight: "bold" },
  ]
});

Font.register({
  family: "Space Grotesk",
  src: "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVnskPMVBTyJL.ttf",
  fontWeight: "bold",
});

const styles = StyleSheet.create({
  page: {
    paddingVertical: 15,
    paddingHorizontal: 110,
    fontFamily: "Hind Siliguri",
    fontSize: 9,
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    height: 390.94,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontFamily: "Space Grotesk",
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  brandDesc: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  invoiceTitle: {
    fontFamily: "Space Grotesk",
    fontSize: 18,
    fontWeight: "bold",
    color: "#cbd5e1",
    letterSpacing: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  headerMetaLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginRight: 6,
  },
  headerMetaValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
  },
  metaItem: {
    marginBottom: 6,
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: "#334155",
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    width: "48%",
  },
  table: {
    width: "100%",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  thItem: { flex: 2.5, fontFamily: "Space Grotesk", fontSize: 9, fontWeight: "bold", color: "#64748b", textTransform: "uppercase" },
  thQty: { flex: 0.5, fontFamily: "Space Grotesk", fontSize: 9, fontWeight: "bold", color: "#64748b", textAlign: "center", textTransform: "uppercase" },
  thPrice: { flex: 1, fontFamily: "Space Grotesk", fontSize: 9, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  thTotal: { flex: 1, fontFamily: "Space Grotesk", fontSize: 9, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  
  tdItem: { flex: 2.5, flexDirection: "row", alignItems: "flex-start" },
  tdItemTitle: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "bold",
  },
  tdItemDesc: { fontSize: 8, color: "#64748b", marginTop: 2 },
  tdQty: { flex: 0.5, fontSize: 9, color: "#475569", textAlign: "center" },
  tdPrice: { flex: 1, fontSize: 9, color: "#475569", textAlign: "right" },
  tdTotal: { flex: 1, fontSize: 9, color: "#1e293b", fontWeight: "bold", textAlign: "right" },
  
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  totalsTable: {
    width: 200,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  totalsValue: {
    fontSize: 9,
    color: "#334155",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 2,
    borderTopWidth: 1.5,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#10b981", // elegant emerald for total
  },
  thankYou: {
    textAlign: "left",
    fontSize: 9,
    color: "#64748b",
    marginTop: 15,
    lineHeight: 1.5,
  }
});


const getPdfFriendlyImageUrl = (url: string, isLogo = false) => {
  if (!url) return "";

  let friendlyUrl = url;
  if (friendlyUrl.includes("cloudinary.com")) {
    friendlyUrl = friendlyUrl.replace(/\.(jpg|jpeg|webp)$/i, ".png");

    // Inject Cloudinary transformations for sizing and quality optimization
    if (friendlyUrl.includes("image/upload/")) {
      const transform = isLogo
        ? "w_120,h_120,c_limit,q_auto"
        : "w_80,h_80,c_fill,q_auto";
      friendlyUrl = friendlyUrl.replace("image/upload/", `image/upload/${transform}/`);
    }
  }

  if (friendlyUrl.startsWith('//')) {
    friendlyUrl = 'https:' + friendlyUrl;
  }

  return friendlyUrl.startsWith('http')
    ? friendlyUrl
    : (typeof window !== "undefined"
      ? window.location.origin + (friendlyUrl.startsWith('/') ? '' : '/') + friendlyUrl
      : friendlyUrl);
};

const clampText = (text: string, maxLength = 28) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
};

interface InvoicePDFProps {
  order: PlacedOrder;
  shippingInfo: ShippingInfo | null;
  siteName: string;
  language: "en" | "bn";
  logoUrl: string;
}

export const InvoicePDFPage = ({ order, shippingInfo, siteName, language, logoUrl }: InvoicePDFProps) => {
  const t = (key: string) => {
    return translations[language]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en] || key;
  };

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl && (
              <Image
                source={{ uri: getPdfFriendlyImageUrl(logoUrl, true) }}
                style={{ width: 68, height: 68, marginRight: 15, objectFit: "contain" }}
              />
            )}
            <View>
              <Text style={styles.brandName}>{siteName}</Text>
              <Text style={styles.brandDesc}>Steadfast Merchant ID - 1661653</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.headerMetaItem}>
              <Text style={styles.headerMetaLabel}>Order # / অর্ডার নং:</Text>
              <Text style={styles.headerMetaValue}>{order.orderNumber}</Text>
            </View>
            <View style={styles.headerMetaItem}>
              <Text style={styles.headerMetaLabel}>Date / তারিখ:</Text>
              <Text style={styles.headerMetaValue}>
                {new Date(order.createdAt).toLocaleString("en-BD", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Customer / ক্রেতা</Text>
              <Text style={styles.value}>{shippingInfo?.fullName || "Customer"}</Text>
              {shippingInfo?.phone && (
                <Text style={[styles.value, { marginTop: 2 }]}>{shippingInfo.phone}</Text>
              )}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Shipping to / ঠিকানা</Text>
              <Text style={styles.value}>{shippingInfo?.address || ""}</Text>
            </View>
          </View>
          {shippingInfo?.notes && (
            <View style={[styles.metaItem, { marginTop: 10 }]}>
              <Text style={styles.label}>Note / নোট</Text>
              <Text style={styles.value}>{shippingInfo.notes}</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thItem}>Item</Text>
            <Text style={styles.thQty}>Qty</Text>
            <Text style={styles.thPrice}>Unit Price</Text>
            <Text style={styles.thTotal}>Total</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tdItem}>
                {item.image && (
                  <Image
                    source={{ uri: getPdfFriendlyImageUrl(item.image, false) }}
                    style={{ width: 36, height: 36, marginRight: 15, borderRadius: 4, objectFit: "contain" }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.tdItemTitle}>{clampText(item.name)}</Text>
                  {(item.color || item.size) && (
                    <Text style={styles.tdItemDesc}>
                      {item.color ? `Variant: ${item.color}` : ""}
                      {item.size ? `${item.color ? " | " : ""}Size: ${item.size}` : ""}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdPrice}>৳{item.price}</Text>
              <Text style={styles.tdTotal}>৳{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t("subtotal")}:</Text>
              <Text style={styles.totalsValue}>৳{order.subtotal}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t("shipping")}:</Text>
              <Text style={styles.totalsValue}>৳{order.shippingCost}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{t("total")}:</Text>
              <Text style={styles.grandTotalValue}>৳{order.totalAmount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.thankYou}>
          <Text style={{ fontWeight: "bold", color: "#475569", marginBottom: 4 }}>Thank you for your order!</Text>
        </View>
      </View>
    </Page>
  );
};

export const InvoicePDF = (props: InvoicePDFProps) => {
  return (
    <Document>
      <InvoicePDFPage {...props} />
    </Document>
  );
};

interface BulkInvoicePDFProps {
  orders: Array<{
    order: PlacedOrder;
    shippingInfo: ShippingInfo | null;
  }>;
  siteName: string;
  language: "en" | "bn";
  logoUrl: string;
}

export const BulkInvoicePDF = ({ orders, siteName, language, logoUrl }: BulkInvoicePDFProps) => {
  return (
    <Document>
      {orders.map((item, index) => (
        <InvoicePDFPage
          key={index}
          order={item.order}
          shippingInfo={item.shippingInfo}
          siteName={siteName}
          language={language}
          logoUrl={logoUrl}
        />
      ))}
    </Document>
  );
};
