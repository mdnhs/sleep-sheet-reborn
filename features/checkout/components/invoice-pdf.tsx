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
    padding: 12,
    fontFamily: "Hind Siliguri",
    fontSize: 8,
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontFamily: "Space Grotesk",
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandDesc: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
  },
  invoiceTitle: {
    fontFamily: "Space Grotesk",
    fontSize: 16,
    fontWeight: "bold",
    color: "#cbd5e1",
    letterSpacing: 2,
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
    fontSize: 6,
    color: "#64748b",
    textTransform: "uppercase",
    marginRight: 4,
  },
  headerMetaValue: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#0f172a",
  },
  metaItem: {
    marginBottom: 4,
  },
  label: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: "#334155",
    fontWeight: "bold",
  },
  leftColumn: {
    width: "35%",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 5,
  },
  rightColumn: {
    width: "62%",
  },
  table: {
    width: "100%",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  thItem: { flex: 2.5, fontFamily: "Space Grotesk", fontSize: 7, fontWeight: "bold", color: "#64748b", textTransform: "uppercase" },
  thQty: { flex: 0.5, fontFamily: "Space Grotesk", fontSize: 7, fontWeight: "bold", color: "#64748b", textAlign: "center", textTransform: "uppercase" },
  thPrice: { flex: 1, fontFamily: "Space Grotesk", fontSize: 7, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  thTotal: { flex: 1, fontFamily: "Space Grotesk", fontSize: 7, fontWeight: "bold", color: "#64748b", textAlign: "right", textTransform: "uppercase" },
  
  tdItem: { flex: 2.5, fontSize: 8, color: "#1e293b", fontWeight: "bold" },
  tdItemDesc: { fontSize: 7, color: "#64748b", marginTop: 2 },
  tdQty: { flex: 0.5, fontSize: 8, color: "#475569", textAlign: "center" },
  tdPrice: { flex: 1, fontSize: 8, color: "#475569", textAlign: "right" },
  tdTotal: { flex: 1, fontSize: 8, color: "#1e293b", fontWeight: "bold", textAlign: "right" },
  
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  totalsTable: {
    width: 130,
    backgroundColor: "#f8fafc",
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  totalsLabel: {
    fontSize: 7,
    color: "#64748b",
  },
  totalsValue: {
    fontSize: 8,
    color: "#334155",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  grandTotalValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#10b981", // elegant emerald for total
  },
  thankYou: {
    textAlign: "left",
    fontSize: 8,
    color: "#64748b",
    marginTop: 15,
    lineHeight: 1.5,
  }
});

interface InvoicePDFProps {
  order: PlacedOrder;
  shippingInfo: ShippingInfo | null;
  siteName: string;
  language: "en" | "bn";
  logoUrl: string;
}

export const InvoicePDF = ({ order, shippingInfo, siteName, language, logoUrl }: InvoicePDFProps) => {
  const t = (key: string) => {
    return translations[language]?.[key as keyof typeof translations.en] || translations.en[key as keyof typeof translations.en] || key;
  };

  return (
    <Document>
      <Page size={[432, 288]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl && logoUrl !== "/logo.png" && (
              <Image 
                source={{ uri: logoUrl.startsWith('http') ? logoUrl : (typeof window !== "undefined" ? window.location.origin + logoUrl : logoUrl) }} 
                style={{ width: 35, height: 35, marginRight: 8, objectFit: "contain" }} 
              />
            )}
            <View>
              <Text style={styles.brandName}>{siteName}</Text>
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
              <Text style={{ fontWeight: "bold", color: "#475569", marginBottom: 2 }}>Thank you for your order!</Text>
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
                    <Text>{item.name}</Text>
                    {(item.color || item.size) && (
                      <Text style={styles.tdItemDesc}>
                        {item.color ? `Variant: ${item.color}` : ""}
                        {item.size ? `${item.color ? " | " : ""}Size: ${item.size}` : ""}
                      </Text>
                    )}
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
    </Document>
  );
};
