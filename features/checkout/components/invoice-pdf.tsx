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
    padding: 23,
    fontFamily: "Hind Siliguri",
    fontSize: 15.5,
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontFamily: "Space Grotesk",
    fontSize: 27,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  brandDesc: {
    fontSize: 13.5,
    color: "#64748b",
    marginTop: 2,
  },
  invoiceTitle: {
    fontFamily: "Space Grotesk",
    fontSize: 31,
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
    marginTop: 4,
  },
  headerMetaLabel: {
    fontSize: 11.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginRight: 8,
  },
  headerMetaValue: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  metaItem: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 17.5,
    color: "#334155",
    fontWeight: "bold",
  },
  leftColumn: {
    width: "35%",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    marginBottom: 10,
  },
  rightColumn: {
    width: "62%",
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  thItem: { flex: 2.5, fontFamily: "Space Grotesk", fontSize: 13.5, fontWeight: "bold", color: "#64748b", textTransform: "uppercase" },
  thQty: { flex: 0.5, fontFamily: "Space Grotesk", fontSize: 13.5, fontWeight: "bold", color: "#64748b", textAlign: "center", textTransform: "uppercase" },
  thPrice: { flex: 1, fontFamily: "Space Grotesk", fontSize: 13.5, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  thTotal: { flex: 1, fontFamily: "Space Grotesk", fontSize: 13.5, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  
  tdItem: { flex: 2.5, flexDirection: "row", alignItems: "flex-start" },
  tdItemDesc: { fontSize: 13.5, color: "#64748b", marginTop: 4 },
  tdQty: { flex: 0.5, fontSize: 15.5, color: "#475569", textAlign: "center" },
  tdPrice: { flex: 1, fontSize: 15.5, color: "#475569", textAlign: "right" },
  tdTotal: { flex: 1, fontSize: 15.5, color: "#1e293b", fontWeight: "bold", textAlign: "right" },
  
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  totalsTable: {
    width: 253,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 13.5,
    color: "#64748b",
  },
  totalsValue: {
    fontSize: 15.5,
    color: "#334155",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    fontSize: 15.5,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  grandTotalValue: {
    fontSize: 17.5,
    fontWeight: "bold",
    color: "#10b981", // elegant emerald for total
  },
  thankYou: {
    textAlign: "left",
    fontSize: 15.5,
    color: "#64748b",
    marginTop: 30,
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

const clampText = (text: string, maxLength = 46) => {
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
    <Page size="A4" orientation="landscape" style={styles.page}>
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

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {/* Left Column (Info & Footer) */}
        <View style={styles.leftColumn}>
          <View style={styles.infoBox}>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Customer / ক্রেতা</Text>
              <Text style={styles.value}>{shippingInfo?.fullName || "Customer"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Shipping to / ঠিকানা</Text>
              <Text style={styles.value}>{shippingInfo?.address || ""}</Text>
            </View>
            {shippingInfo?.notes && (
              <View style={styles.metaItem}>
                <Text style={styles.label}>Note / নোট</Text>
                <Text style={styles.value}>{shippingInfo.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.thankYou}>
            <Text style={{ fontWeight: "bold", color: "#475569", marginBottom: 4 }}>Thank you for your order!</Text>
          </View>
        </View>

        {/* Right Column (Items & Totals) */}
        <View style={styles.rightColumn}>
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
                      style={{ width: 47, height: 47, marginRight: 15, borderRadius: 4, objectFit: "contain" }} 
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, color: "#1e293b", fontWeight: "bold" }}>{clampText(item.name)}</Text>
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
