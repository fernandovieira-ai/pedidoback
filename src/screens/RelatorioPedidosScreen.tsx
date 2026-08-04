import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { CrossPlatformDatePicker } from "../components/CrossPlatformDatePicker";
import { colors } from "../styles/colors";
import {
  obterRelatorioPedidosPeriodo,
  agruparPorPedido,
  PedidoAgrupado,
  ResumoRelatorioPedidos,
} from "../services/relatorioService";
import { formatCurrency, formatDecimal } from "../utils/formatters";

interface RelatorioPedidosScreenProps {
  navigation: any;
  route: any;
}

const formatarDataExibicao = (date: Date): string => {
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

export default function RelatorioPedidosScreen({
  navigation,
  route,
}: RelatorioPedidosScreenProps) {
  const { usuario, schema, empresa, nome_empresa } = route.params || {};

  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFim, setShowDatePickerFim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoAgrupado[]>([]);
  const [resumo, setResumo] = useState<ResumoRelatorioPedidos | null>(null);

  const carregarRelatorio = useCallback(
    async (inicio?: Date, fim?: Date) => {
      if (!schema || !empresa) {
        Alert.alert("Erro", "Dados incompletos. Faça login novamente.");
        return;
      }

      const inicioConsulta = formatarDataExibicao(inicio || dataInicio);
      const fimConsulta = formatarDataExibicao(fim || dataFim);

      try {
        setLoading(true);
        const resultado = await obterRelatorioPedidosPeriodo(
          schema,
          empresa.cod_empresa,
          usuario,
          inicioConsulta,
          fimConsulta,
        );

        if (resultado.success && resultado.data) {
          setPedidos(agruparPorPedido(resultado.data.itens));
          setResumo(resultado.data.resumo);
        } else {
          Alert.alert("Erro", resultado.message || "Erro ao carregar relatório");
          setPedidos([]);
          setResumo(null);
        }
      } catch (error) {
        console.error("Erro ao carregar relatório:", error);
        Alert.alert("Erro", "Erro ao carregar relatório");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, empresa, usuario, dataInicio, dataFim],
  );

  useFocusEffect(
    useCallback(() => {
      carregarRelatorio();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    carregarRelatorio();
  };

  const handleDateChangeInicio = (_event: any, date?: Date) => {
    setShowDatePickerInicio(false);
    if (!date) return;

    setDataInicio(date);
    const novaFim = date > dataFim ? date : dataFim;
    if (novaFim !== dataFim) setDataFim(novaFim);
    carregarRelatorio(date, novaFim);
  };

  const handleDateChangeFim = (_event: any, date?: Date) => {
    setShowDatePickerFim(false);
    if (!date) return;

    setDataFim(date);
    carregarRelatorio(dataInicio, date);
  };

  const irParaHoje = () => {
    const hoje = new Date();
    setDataInicio(hoje);
    setDataFim(hoje);
    carregarRelatorio(hoje, hoje);
  };

  const gerarHtmlRelatorio = (): string => {
    const dataInicioFormatada = formatarDataExibicao(dataInicio);
    const dataFimFormatada = formatarDataExibicao(dataFim);
    const periodoFormatado =
      dataInicioFormatada === dataFimFormatada
        ? dataInicioFormatada
        : `${dataInicioFormatada} a ${dataFimFormatada}`;
    const geradoEm = new Date().toLocaleString("pt-BR");

    const linhasHtml = pedidos
      .map((pedido) => {
        const statusLabel =
          pedido.ind_sincronizado === "S" ? "ENVIADO" : "PENDENTE";
        const statusColor =
          pedido.ind_sincronizado === "S" ? "#059669" : "#d97706";

        const itensHtml = pedido.itens
          .map(
            (item, idx) => `
              <tr>
                ${
                  idx === 0
                    ? `<td class="col-pedido" rowspan="${pedido.itens.length}">${pedido.seq_pedido}</td>
                       <td class="col-data" rowspan="${pedido.itens.length}">${pedido.dat_pedido}</td>
                       <td class="col-prevenda" rowspan="${pedido.itens.length}">${pedido.num_pre_venda || "—"}</td>
                       <td class="col-cliente" rowspan="${pedido.itens.length}">${pedido.cliente || "-"}</td>`
                    : ""
                }
                <td class="col-produto">${item.produto}</td>
                <td class="col-num">${formatDecimal(item.qtd_item, 2)}</td>
                <td class="col-num">${formatCurrency(item.val_unitario)}</td>
                <td class="col-num">${formatCurrency(item.val_total)}</td>
                ${
                  idx === 0
                    ? `<td class="col-status" rowspan="${pedido.itens.length}"><span class="badge" style="background:${statusColor}">${statusLabel}</span></td>
                       <td class="col-num-total" rowspan="${pedido.itens.length}">${formatCurrency(pedido.val_total_pedido)}</td>`
                    : ""
                }
              </tr>
            `,
          )
          .join("");

        return itensHtml;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body { font-family: Helvetica, Arial, sans-serif; color: #1a1a2e; padding: 24px; }
            h1 { font-size: 18px; color: #24024b; margin-bottom: 2px; }
            .subtitulo { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
            .resumo { display: flex; gap: 12px; margin-bottom: 20px; }
            .resumo-item { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
            .resumo-item .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
            .resumo-item .valor { font-size: 16px; font-weight: bold; color: #24024b; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #24024b; color: #fff; padding: 6px 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
            .col-num, .col-num-total { text-align: right; }
            .col-data { white-space: nowrap; }
            .badge { color: #fff; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
            .rodape { margin-top: 20px; font-size: 9px; color: #9ca3af; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Relatório de Pedidos — ${nome_empresa || ""}</h1>
          <div class="subtitulo">Vendedor: ${usuario || "-"} &nbsp;|&nbsp; Período: ${periodoFormatado}</div>

          <div class="resumo">
            <div class="resumo-item"><div class="label">Pedidos</div><div class="valor">${resumo?.qtd_pedidos ?? 0}</div></div>
            <div class="resumo-item"><div class="label">Enviados</div><div class="valor">${resumo?.qtd_enviados ?? 0}</div></div>
            <div class="resumo-item"><div class="label">Pendentes</div><div class="valor">${resumo?.qtd_pendentes ?? 0}</div></div>
            <div class="resumo-item"><div class="label">Valor Total</div><div class="valor">${formatCurrency(resumo?.val_total_dia ?? 0)}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Data</th>
                <th>Pré-venda</th>
                <th>Cliente</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Vr. Unit.</th>
                <th>Vr. Total</th>
                <th>Status</th>
                <th>Total Pedido</th>
              </tr>
            </thead>
            <tbody>
              ${linhasHtml || `<tr><td colspan="10" style="text-align:center; padding:20px;">Nenhum pedido encontrado</td></tr>`}
            </tbody>
          </table>

          <div class="rodape">Gerado em ${geradoEm}</div>
        </body>
      </html>
    `;
  };

  const exportarPDF = async () => {
    if (pedidos.length === 0) {
      Alert.alert("Aviso", "Não há pedidos para exportar nesse período.");
      return;
    }

    try {
      setExportando(true);
      const html = gerarHtmlRelatorio();
      const { uri } = await Print.printToFileAsync({ html });

      const disponivel = await Sharing.isAvailableAsync();
      if (disponivel) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Relatório de Pedidos",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF gerado", `Arquivo salvo em: ${uri}`);
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF do relatório");
    } finally {
      setExportando(false);
    }
  };

  const renderPedido = ({ item }: { item: PedidoAgrupado }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View style={styles.pedidoHeaderEsquerda}>
          <Text style={styles.pedidoNumero}>Pedido #{item.seq_pedido}</Text>
          <Text style={styles.pedidoPreVenda}>
            Pré-venda: {item.num_pre_venda || "—"}
          </Text>
        </View>
        <View style={styles.pedidoHeaderDireita}>
          <View
            style={[
              styles.badge,
              item.ind_sincronizado === "S"
                ? styles.badgeEnviado
                : styles.badgePendente,
            ]}
          >
            <Text style={styles.badgeTexto}>
              {item.ind_sincronizado === "S" ? "Enviado" : "Pendente"}
            </Text>
          </View>
          <Text style={styles.pedidoData}>📅 {item.dat_pedido}</Text>
        </View>
      </View>

      <Text style={styles.pedidoCliente}>{item.cliente}</Text>

      <View style={styles.tabelaItens}>
        <View style={styles.tabelaHeader}>
          <Text style={[styles.tabelaHeaderTexto, styles.colProduto]}>
            Produto
          </Text>
          <Text style={[styles.tabelaHeaderTexto, styles.colQtd]}>Qtd</Text>
          <Text style={[styles.tabelaHeaderTexto, styles.colValor]}>
            Vr. Unit.
          </Text>
          <Text style={[styles.tabelaHeaderTexto, styles.colValor]}>
            Vr. Total
          </Text>
        </View>

        {item.itens.map((produto, idx) => (
          <View key={`${item.seq_pedido}-${idx}`} style={styles.tabelaLinha}>
            <Text style={[styles.tabelaTexto, styles.colProduto]} numberOfLines={2}>
              {produto.produto}
            </Text>
            <Text style={[styles.tabelaTexto, styles.colQtd]}>
              {formatDecimal(produto.qtd_item, 0)}
            </Text>
            <Text style={[styles.tabelaTexto, styles.colValor]}>
              {formatCurrency(produto.val_unitario)}
            </Text>
            <Text style={[styles.tabelaTexto, styles.colValor]}>
              {formatCurrency(produto.val_total)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.pedidoFooter}>
        <Text style={styles.pedidoFooterLabel}>Total do pedido</Text>
        <Text style={styles.pedidoFooterValor}>
          {formatCurrency(item.val_total_pedido)}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Relatório de Pedidos</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportarPDF}
            disabled={exportando || loading}
          >
            {exportando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.exportIcon}>📤</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtro de período */}
        <View style={styles.filtroData}>
          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => setShowDatePickerInicio(true)}
          >
            <Text style={styles.dataIcon}>📅</Text>
            <Text style={styles.dataTexto}>
              {formatarDataExibicao(dataInicio)}
            </Text>
          </TouchableOpacity>
          <Text style={styles.periodoSeparador}>até</Text>
          <TouchableOpacity
            style={styles.dataButton}
            onPress={() => setShowDatePickerFim(true)}
          >
            <Text style={styles.dataIcon}>📅</Text>
            <Text style={styles.dataTexto}>{formatarDataExibicao(dataFim)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hojeButton} onPress={irParaHoje}>
            <Text style={styles.hojeButtonTexto}>Hoje</Text>
          </TouchableOpacity>
        </View>

        <CrossPlatformDatePicker
          show={showDatePickerInicio}
          value={dataInicio}
          onChange={handleDateChangeInicio}
          onClose={() => setShowDatePickerInicio(false)}
          title="Data Inicial do Relatório"
        />
        <CrossPlatformDatePicker
          show={showDatePickerFim}
          value={dataFim}
          onChange={handleDateChangeFim}
          onClose={() => setShowDatePickerFim(false)}
          title="Data Final do Relatório"
          minimumDate={dataInicio}
        />

        {/* Resumo do dia */}
        {resumo && (
          <View style={styles.resumoContainer}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoValor}>{resumo.qtd_pedidos}</Text>
              <Text style={styles.resumoLabel}>Pedidos</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: colors.success }]}>
                {resumo.qtd_enviados}
              </Text>
              <Text style={styles.resumoLabel}>Enviados</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: "#d97706" }]}>
                {resumo.qtd_pendentes}
              </Text>
              <Text style={styles.resumoLabel}>Pendentes</Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoValorMoeda} numberOfLines={1}>
                {formatCurrency(resumo.val_total_dia)}
              </Text>
              <Text style={styles.resumoLabel}>Total</Text>
            </View>
          </View>
        )}

        {/* Lista de pedidos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.loadingText}>Carregando relatório...</Text>
          </View>
        ) : (
          <FlatList
            data={pedidos}
            keyExtractor={(item) => item.seq_pedido.toString()}
            renderItem={renderPedido}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum pedido nesse período</Text>
                <Text style={styles.emptySubtext}>
                  Selecione outro período ou crie um novo pedido
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: colors.white,
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.white,
  },
  exportButton: {
    padding: 5,
    width: 30,
    alignItems: "center",
  },
  exportIcon: {
    fontSize: 20,
  },
  filtroData: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  dataButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  periodoSeparador: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  dataIcon: {
    fontSize: 14,
  },
  dataTexto: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  hojeButton: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hojeButtonTexto: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  resumoContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  resumoItem: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  resumoValor: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  resumoValorMoeda: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },
  resumoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  pedidoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  pedidoHeaderEsquerda: {
    flex: 1,
  },
  pedidoHeaderDireita: {
    alignItems: "flex-end",
    gap: 4,
  },
  pedidoNumero: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  pedidoPreVenda: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pedidoData: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeEnviado: {
    backgroundColor: colors.success,
  },
  badgePendente: {
    backgroundColor: "#d97706",
  },
  badgeTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  pedidoCliente: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  tabelaItens: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  tabelaHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tabelaHeaderTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.mediumGray,
    textTransform: "uppercase",
  },
  tabelaLinha: {
    flexDirection: "row",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  tabelaTexto: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  colProduto: {
    flex: 2.4,
    paddingRight: 4,
  },
  colQtd: {
    flex: 0.7,
    textAlign: "right",
  },
  colValor: {
    flex: 1.2,
    textAlign: "right",
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginTop: 8,
    paddingTop: 8,
  },
  pedidoFooterLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pedidoFooterValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
