import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../styles/colors";

interface CrossPlatformDatePickerProps {
  show: boolean;
  value: Date;
  onChange: (event: any, date?: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  title?: string;
}

export const CrossPlatformDatePicker = ({
  show,
  value,
  onChange,
  onClose,
  minimumDate,
  title = "Selecionar Data",
}: CrossPlatformDatePickerProps) => {
  if (!show) return null;

  // Formata para YYYY-MM-DD (formato que o input type="date" espera)
  const toInputValue = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    // Usar T12:00:00 para evitar problemas de fuso horário
    const selected = new Date(e.target.value + "T12:00:00");
    onChange({} as any, selected);
    onClose();
  };

  return (
    // @ts-ignore — View no web renderiza como div, overlay funciona normalmente
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* @ts-ignore — elemento HTML nativo no web */}
        <input
          type="date"
          defaultValue={toInputValue(value)}
          min={minimumDate ? toInputValue(minimumDate) : undefined}
          onChange={handleChange}
          style={{
            fontSize: 16,
            padding: "12px 16px",
            margin: "16px",
            borderRadius: 8,
            border: "1.5px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            color: "#1f2937",
            width: "calc(100% - 32px)",
            boxSizing: "border-box" as any,
            outline: "none",
            cursor: "pointer",
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  closeText: {
    fontSize: 18,
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
});
