import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  const [internalDate, setInternalDate] = useState<Date>(value);

  if (!show) return null;

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={(event, date) => {
          onChange(event, date);
          onClose();
        }}
        locale="pt-BR"
        minimumDate={minimumDate}
      />
    );
  }

  // iOS — modal com botões Cancelar / Confirmar
  return (
    <Modal
      visible={show}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                onChange({} as any, internalDate);
                onClose();
              }}
            >
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={internalDate}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (date) setInternalDate(date);
            }}
            locale="pt-BR"
            minimumDate={minimumDate}
            style={styles.iosPicker}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
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
  cancelText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
  iosPicker: {
    width: "100%",
  },
});
