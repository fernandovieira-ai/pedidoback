import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../styles/colors";
import {
  pesquisarClientes,
  Cliente,
  EnderecoCliente,
  buscarEnderecosCliente,
} from "../services/clienteService";
import {
  pesquisarItens,
  Item,
  ItemPedido,
  buscarDetalhesItens,
} from "../services/itemService";
import {
  pesquisarCondicoesPagamento,
  CondicaoPagamento,
  calcularParcelasAutomaticas,
  buscarUltimaCondicaoPagamentoCliente,
} from "../services/condicaoPagamentoService";
import {
  listarTiposCobranca,
  TipoCobranca,
  buscarTipoCobrancaPadrao,
} from "../services/tipoCobrancaService";
import { criarPedido, atualizarPedido } from "../services/pedidoService";
import { formatDate, unformatDate, formatCurrency } from "../utils/formatters";
import {
  buscarParametrosPreco,
  ParametrosPreco,
  buscarParametroItensIniciais,
} from "../services/parametroService";

// Interface para parcelas/vencimentos
interface Parcela {
  numero: number;
  dataVencimento: string;
  valor: number;
}

interface AddPedidoScreenProps {
  navigation: any;
  route: any;
}

export default function AddPedidoScreen({
  navigation,
  route,
}: AddPedidoScreenProps) {
  const { usuario, cnpj, schema, empresa, pedidoParaEditar } =
    route.params || {};
  const modoEdicao = !!pedidoParaEditar;

  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null,
  );
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [desconto, setDesconto] = useState("");
  const [acrescimo, setAcrescimo] = useState("");
  const [frete, setFrete] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estados da pesquisa de cliente
  const [modalVisible, setModalVisible] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [todosClientes, setTodosClientes] = useState<Cliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);

  // Estados da pesquisa de itens
  const [modalItemVisible, setModalItemVisible] = useState(false);
  const [termoPesquisaItem, setTermoPesquisaItem] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [pesquisandoItens, setPesquisandoItens] = useState(false);

  // Estados da condição de pagamento
  const [modalCondicaoVisible, setModalCondicaoVisible] = useState(false);
  const [condicoesPagamento, setCondicoesPagamento] = useState<
    CondicaoPagamento[]
  >([]);
  const [condicaoSelecionada, setCondicaoSelecionada] =
    useState<CondicaoPagamento | null>(null);
  const [pesquisandoCondicoes, setPesquisandoCondicoes] = useState(false);

  // Estados de tipo de cobrança
  const [modalTipoCobrancaVisible, setModalTipoCobrancaVisible] =
    useState(false);
  const [tiposCobranca, setTiposCobranca] = useState<TipoCobranca[]>([]);
  const [tipoCobrancaSelecionado, setTipoCobrancaSelecionado] =
    useState<TipoCobranca | null>(null);
  const [carregandoTiposCobranca, setCarregandoTiposCobranca] = useState(false);

  // Estados de endereço do cliente
  const [modalEnderecoVisible, setModalEnderecoVisible] = useState(false);
  const [enderecosCliente, setEnderecosCliente] = useState<EnderecoCliente[]>(
    [],
  );
  const [enderecoSelecionado, setEnderecoSelecionado] =
    useState<EnderecoCliente | null>(null);
  const [pesquisandoEnderecos, setPesquisandoEnderecos] = useState(false);

  // Estados de parcelamento
  const [modalParcelasVisible, setModalParcelasVisible] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState("1");
  const [dataVencimentoInicial, setDataVencimentoInicial] = useState("");
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [showDatePickerVencimento, setShowDatePickerVencimento] =
    useState(false);
  const [selectedDateVencimento, setSelectedDateVencimento] = useState(
    new Date(),
  );

  // Flag para controlar carregamento inicial em modo edição
  const [carregandoDadosIniciais, setCarregandoDadosIniciais] = useState(false);

  // Estados dos parâmetros de preço
  const [parametrosPreco, setParametrosPreco] =
    useState<ParametrosPreco | null>(null);

  // Estado para rastrear preços sendo editados (índice do item -> texto)
  const [precosEmEdicao, setPrecosEmEdicao] = useState<Record<number, string>>(
    {},
  );

  const itemSearchInputRef = useRef<TextInput>(null);

  // Carregar parâmetros de preço ao montar o componente
  useEffect(() => {
    if (schema) {
      carregarParametrosPreco();
      carregarTipoCobrancaPadrao();
    }
  }, [schema]);

  const carregarParametrosPreco = async () => {
    try {
      const resultado = await buscarParametrosPreco(schema);
      if (resultado.success && resultado.data) {
        setParametrosPreco(resultado.data);
      }
    } catch (error) {
      console.error("Erro ao carregar parâmetros de preço:", error);
    }
  };

  const carregarTipoCobrancaPadrao = async () => {
    try {
      const resultadoParametro = await buscarTipoCobrancaPadrao(schema);

      if (
        resultadoParametro.success &&
        resultadoParametro.data?.cod_tipo_cobranca_padrao
      ) {
        const codTipoPadrao = resultadoParametro.data.cod_tipo_cobranca_padrao;
        console.log(`💳 Tipo de cobrança padrão configurado: ${codTipoPadrao}`);

        // Buscar todos os tipos para encontrar o padrão
        const resultadoTipos = await listarTiposCobranca(schema);

        if (resultadoTipos.success && resultadoTipos.data) {
          const tipoPadrao = resultadoTipos.data.find(
            (t) => t.cod_tipo_cobranca === codTipoPadrao,
          );

          if (tipoPadrao) {
            setTipoCobrancaSelecionado(tipoPadrao);
            console.log(
              `✅ Tipo de cobrança padrão selecionado: ${tipoPadrao.des_tipo_cobranca}`,
            );
          }
        }
      } else {
        console.log("ℹ️ Tipo de cobrança padrão não configurado");
      }
    } catch (error) {
      console.error("Erro ao carregar tipo de cobrança padrão:", error);
    }
  };

  // Debounce para pesquisa de itens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (termoPesquisaItem.trim().length >= 2) {
        handlePesquisarItens(termoPesquisaItem);
      } else if (termoPesquisaItem.trim().length === 0) {
        setItens([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [termoPesquisaItem]);

  // Carregar dados do pedido quando estiver em modo de edição
  useEffect(() => {
    if (modoEdicao && pedidoParaEditar) {
      // Função assíncrona para carregar os dados
      const carregarDados = async () => {
        // Marca que está carregando dados iniciais
        setCarregandoDadosIniciais(true);

        // Preencher cliente
        const cliente: Cliente = {
          cod_pessoa: pedidoParaEditar.cod_cliente,
          nom_pessoa: pedidoParaEditar.cliente,
          num_cnpj: pedidoParaEditar.num_cnpj || "",
        };
        setClienteSelecionado(cliente);

        // Preencher data de entrega
        setDataEntrega(pedidoParaEditar.dat_entrega);

        // Preencher itens - primeiro converte os dados básicos
        const itensConvertidos: ItemPedido[] = pedidoParaEditar.itens.map(
          (item) => ({
            cod_item: item.cod_item,
            des_item: item.des_item,
            cod_barra: "",
            cod_referencia: "",
            des_unidade: item.des_unidade || "",
            num_fator_conversao: 1,
            val_preco_venda: item.val_unitario,
            val_custo_medio: 0,
            val_custo_unitario: 0,
            per_margem_desejada: 0,
            quantidade: item.quantidade,
            val_total: item.val_total,
          }),
        );

        // Busca os detalhes atualizados (preços e custos) do banco de dados
        if (schema && empresa) {
          try {
            const codItens = itensConvertidos.map((item) => item.cod_item);
            const resultado = await buscarDetalhesItens(
              schema,
              empresa.cod_empresa,
              codItens,
            );

            if (resultado.success && resultado.data) {
              console.log("📦 Detalhes dos itens carregados:", resultado.data);

              // Mescla os detalhes com os itens convertidos
              // IMPORTANTE: Mantém o preço e total do pedido original, busca apenas custos e margem para validação
              const itensComDetalhes = itensConvertidos.map((item) => {
                const detalhes = resultado.data![item.cod_item];
                if (detalhes) {
                  return {
                    ...item,
                    // MANTÉM o val_preco_venda do pedido original (item.val_preco_venda já tem o valor correto)
                    // MANTÉM o val_total do pedido original (item.val_total já tem o valor correto)
                    // Atualiza APENAS os custos e margem para validação
                    val_custo_medio: detalhes.val_custo_medio,
                    val_custo_unitario: detalhes.val_custo_unitario,
                    per_margem_desejada: detalhes.per_margem_desejada,
                  };
                }
                return item;
              });

              setItensPedido(itensComDetalhes);
            } else {
              console.warn(
                "⚠️ Não foi possível carregar detalhes dos itens, usando valores salvos",
              );
              setItensPedido(itensConvertidos);
            }
          } catch (error) {
            console.error("❌ Erro ao buscar detalhes dos itens:", error);
            setItensPedido(itensConvertidos);
          }
        } else {
          setItensPedido(itensConvertidos);
        }

        // Preencher condição de pagamento
        if (
          pedidoParaEditar.cod_condicao_pagamento &&
          pedidoParaEditar.des_condicao_pagamento
        ) {
          const condicao: CondicaoPagamento = {
            cod_condicao_pagamento: pedidoParaEditar.cod_condicao_pagamento,
            des_condicao_pagamento: pedidoParaEditar.des_condicao_pagamento,
            ind_tipo_condicao: "N",
          };
          setCondicaoSelecionada(condicao);
        }

        // Preencher valores
        setDesconto(
          pedidoParaEditar.val_desconto > 0
            ? pedidoParaEditar.val_desconto.toString()
            : "",
        );
        setAcrescimo(
          pedidoParaEditar.val_acrescimo > 0
            ? pedidoParaEditar.val_acrescimo.toString()
            : "",
        );
        setFrete(
          pedidoParaEditar.val_frete > 0
            ? pedidoParaEditar.val_frete.toString()
            : "",
        );
        setObservacao(pedidoParaEditar.des_observacao || "");

        // Preencher parcelas
        if (pedidoParaEditar.parcelas && pedidoParaEditar.parcelas.length > 0) {
          console.log(
            "📋 Carregando parcelas do pedido:",
            pedidoParaEditar.parcelas,
          );

          // Verifica se há parcelas sem data de vencimento
          const parcelasSemData = pedidoParaEditar.parcelas.filter(
            (p) => !p.dataVencimento || p.dataVencimento.trim() === "",
          );

          if (parcelasSemData.length > 0) {
            console.warn(
              `⚠️ ${parcelasSemData.length} parcela(s) sem data de vencimento detectada(s)`,
            );

            // Verifica se a condição é automática
            const isCondicaoAutomatica =
              (pedidoParaEditar as any).ind_tipo_condicao === "A";
            console.log(
              `ℹ️ Tipo da condição: ${
                (pedidoParaEditar as any).ind_tipo_condicao
              } (Automática: ${isCondicaoAutomatica})`,
            );

            // Se a condição é automática, recalcula as parcelas
            if (
              isCondicaoAutomatica &&
              pedidoParaEditar.cod_condicao_pagamento
            ) {
              console.log(
                "🔄 Condição automática detectada - recalculando parcelas...",
              );

              // Agenda o recálculo após o carregamento completo
              setTimeout(async () => {
                try {
                  const hoje = new Date();
                  const dia = String(hoje.getDate()).padStart(2, "0");
                  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
                  const ano = hoje.getFullYear();
                  const dataHoje = `${dia}/${mes}/${ano}`;

                  const resultado = await calcularParcelasAutomaticas(
                    schema,
                    pedidoParaEditar.cod_condicao_pagamento,
                    pedidoParaEditar.val_total,
                    dataHoje,
                  );

                  if (resultado.success && resultado.data) {
                    const parcelasRecalculadas: Parcela[] = resultado.data.map(
                      (p) => ({
                        numero: p.numero,
                        dataVencimento: p.dataVencimento,
                        valor: p.valor,
                      }),
                    );
                    console.log(
                      "✅ Parcelas recalculadas automaticamente:",
                      parcelasRecalculadas,
                    );
                    setParcelas(parcelasRecalculadas);
                    setNumeroParcelas(parcelasRecalculadas.length.toString());
                    if (parcelasRecalculadas[0]?.dataVencimento) {
                      setDataVencimentoInicial(
                        parcelasRecalculadas[0].dataVencimento,
                      );
                    }
                  } else {
                    console.warn(
                      "⚠️ Não foi possível recalcular - usando parcelas originais",
                    );
                    setParcelas(pedidoParaEditar.parcelas);
                    setNumeroParcelas(
                      pedidoParaEditar.parcelas.length.toString(),
                    );
                  }
                } catch (error) {
                  console.error("❌ Erro ao recalcular parcelas:", error);
                  setParcelas(pedidoParaEditar.parcelas);
                  setNumeroParcelas(
                    pedidoParaEditar.parcelas.length.toString(),
                  );
                }
              }, 500);
            } else {
              console.log(
                "ℹ️ Condição manual ou sem condição - mantendo parcelas originais (mesmo sem data)",
              );
              setParcelas(pedidoParaEditar.parcelas);
              setNumeroParcelas(pedidoParaEditar.parcelas.length.toString());
            }
          } else {
            // Todas as parcelas têm data, carrega normalmente
            setParcelas(pedidoParaEditar.parcelas);
            setNumeroParcelas(pedidoParaEditar.parcelas.length.toString());
            if (pedidoParaEditar.parcelas[0].dataVencimento) {
              setDataVencimentoInicial(
                pedidoParaEditar.parcelas[0].dataVencimento,
              );
            }
          }
        }

        // Carregar endereço do pedido
        if (pedidoParaEditar.seq_endereco) {
          try {
            console.log(
              `🔍 Carregando endereço do pedido: seq_endereco ${pedidoParaEditar.seq_endereco}`,
            );
            const resultadoEnderecos = await buscarEnderecosCliente(
              schema,
              pedidoParaEditar.cod_cliente,
            );

            if (resultadoEnderecos.success && resultadoEnderecos.data) {
              const enderecos = resultadoEnderecos.data;
              setEnderecosCliente(enderecos);

              // Encontrar o endereço específico do pedido
              const enderecoEncontrado = enderecos.find(
                (e) => e.seq_endereco === pedidoParaEditar.seq_endereco,
              );

              if (enderecoEncontrado) {
                setEnderecoSelecionado(enderecoEncontrado);
                console.log(
                  `✅ Endereço do pedido carregado: ${enderecoEncontrado.des_logradouro}`,
                );
              } else {
                console.warn(
                  `⚠️ Endereço seq_endereco ${pedidoParaEditar.seq_endereco} não encontrado`,
                );
              }
            }
          } catch (error) {
            console.error("❌ Erro ao carregar endereço do pedido:", error);
          }
        }

        // Carregar tipo de cobrança do pedido
        if (pedidoParaEditar.cod_tipo_cobranca) {
          try {
            console.log(
              `🔍 Carregando tipo de cobrança do pedido: cod_tipo_cobranca ${pedidoParaEditar.cod_tipo_cobranca}`,
            );
            const resultadoTipos = await listarTiposCobranca(schema);

            if (resultadoTipos.success && resultadoTipos.data) {
              const tipos = resultadoTipos.data;
              setTiposCobranca(tipos);

              // Encontrar o tipo de cobrança específico do pedido
              const tipoEncontrado = tipos.find(
                (t) => t.cod_tipo_cobranca === pedidoParaEditar.cod_tipo_cobranca,
              );

              if (tipoEncontrado) {
                setTipoCobrancaSelecionado(tipoEncontrado);
                console.log(
                  `✅ Tipo de cobrança do pedido carregado: ${tipoEncontrado.des_tipo_cobranca}`,
                );
              } else {
                console.warn(
                  `⚠️ Tipo de cobrança cod_tipo_cobranca ${pedidoParaEditar.cod_tipo_cobranca} não encontrado`,
                );
              }
            }
          } catch (error) {
            console.error("❌ Erro ao carregar tipo de cobrança do pedido:", error);
          }
        }

        // Desmarca flag após carregar todos os dados (pequeno delay para garantir que estados foram atualizados)
        setTimeout(() => {
          setCarregandoDadosIniciais(false);
        }, 100);
      };

      // Chama a função assíncrona
      carregarDados();
    }
  }, [modoEdicao, pedidoParaEditar]);

  // Recalcular parcelas automaticamente quando valores do pedido mudarem
  useEffect(() => {
    // Não recalcula se estiver carregando dados iniciais em modo edição
    if (carregandoDadosIniciais) {
      return;
    }

    // Só recalcula se já tiver parcelas configuradas E se não estiver carregando
    // E se todas as parcelas tiverem data de vencimento
    if (parcelas.length > 0 && !loading) {
      // Verificar se todas as parcelas têm data de vencimento
      const todasPossuemData = parcelas.every(
        (p) => p.dataVencimento && p.dataVencimento.trim() !== "",
      );

      if (!todasPossuemData) {
        console.log("Pulando recálculo: parcelas sem data de vencimento");
        return;
      }

      const total = calcularTotal();
      const numParcelas = parcelas.length; // Usa o número de parcelas já existente
      const valorParcela = total / numParcelas;

      // Recalcular APENAS os valores das parcelas, mantendo número e datas
      const parcelasAtualizadas = parcelas.map((parcela, index) => ({
        numero: parcela.numero,
        dataVencimento: parcela.dataVencimento, // Mantém a data original
        valor:
          index === numParcelas - 1
            ? total - valorParcela * (numParcelas - 1) // Última parcela ajusta diferença
            : valorParcela,
      }));

      console.log(
        "🔄 Recalculando parcelas (valores apenas):",
        parcelasAtualizadas,
      );
      setParcelas(parcelasAtualizadas);
    }
  }, [desconto, acrescimo, frete, itensPedido]);

  // Pesquisar clientes no backend com paginação
  const handlePesquisarClientes = async (
    termo: string = termoPesquisa,
    resetList: boolean = true,
  ) => {
    if (!schema) {
      Alert.alert("Erro", "Schema não encontrado. Faça login novamente.");
      return;
    }

    try {
      if (resetList) {
        setPesquisando(true);
        setOffset(0);
      } else {
        setCarregandoMais(true);
      }

      const currentOffset = resetList ? 0 : offset;
      const response = await pesquisarClientes(
        schema,
        usuario,
        termo,
        100,
        currentOffset,
      );

      if (response.success && response.data) {
        const novosClientes = resetList
          ? response.data
          : [...todosClientes, ...response.data];

        setTodosClientes(novosClientes);
        setClientes(novosClientes);
        setHasMore(response.pagination?.hasMore || false);
        setTotalClientes(response.pagination?.total || 0);
        setOffset(currentOffset + response.data.length);
      } else {
        Alert.alert("Erro", response.message);
        if (resetList) {
          setTodosClientes([]);
          setClientes([]);
        }
      }
    } catch (error) {
      console.error("Erro ao pesquisar clientes:", error);
      Alert.alert("Erro", "Erro ao pesquisar clientes");
      if (resetList) {
        setTodosClientes([]);
        setClientes([]);
      }
    } finally {
      setPesquisando(false);
      setCarregandoMais(false);
    }
  };

  // Carregar mais clientes (scroll infinito)
  const carregarMaisClientes = () => {
    if (!pesquisando && !carregandoMais && hasMore) {
      handlePesquisarClientes(termoPesquisa, false);
    }
  };

  // Buscar clientes no backend ao digitar
  const handleTermoPesquisaChange = (termo: string) => {
    setTermoPesquisa(termo);

    // Busca no backend quando tiver pelo menos 2 caracteres
    if (termo.trim().length >= 2) {
      handlePesquisarClientes(termo, true);
    } else if (termo.trim().length === 0) {
      // Limpa a lista quando apagar tudo
      setClientes([]);
      setTodosClientes([]);
      setOffset(0);
      setHasMore(false);
      setTotalClientes(0);
    }
  };

  // Abrir modal de pesquisa (não carrega nada automaticamente)
  const abrirPesquisaCliente = () => {
    setModalVisible(true);
    setTermoPesquisa("");
    setTodosClientes([]);
    setClientes([]);
    setOffset(0);
    setHasMore(false);
    setTotalClientes(0);
  };

  // Selecionar cliente
  const selecionarCliente = async (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setModalVisible(false);
    setTermoPesquisa("");
    setTodosClientes([]);
    setClientes([]);
    setOffset(0);
    setHasMore(true);

    // Buscar endereços do cliente
    if (schema && cliente.cod_pessoa) {
      try {
        console.log(
          `🔍 Buscando endereços do cliente ${cliente.cod_pessoa}...`,
        );
        setPesquisandoEnderecos(true);
        const resultado = await buscarEnderecosCliente(
          schema,
          cliente.cod_pessoa,
        );

        if (resultado.success && resultado.data) {
          const enderecos = resultado.data;
          console.log(`✅ ${enderecos.length} endereço(s) encontrado(s)`);
          setEnderecosCliente(enderecos);

          if (enderecos.length >= 2) {
            // Tem 2 ou mais endereços - abrir modal de seleção
            setModalEnderecoVisible(true);
          } else if (enderecos.length === 1) {
            // Tem apenas 1 endereço - selecionar automaticamente
            setEnderecoSelecionado(enderecos[0]);
            console.log(
              `✅ Endereço único selecionado automaticamente: seq_endereco ${enderecos[0].seq_endereco}`,
            );
          } else {
            // Nenhum endereço encontrado
            setEnderecoSelecionado(null);
            console.log(`ℹ️ Cliente sem endereço cadastrado`);
          }
        }
        setPesquisandoEnderecos(false);
      } catch (error) {
        console.error("❌ Erro ao buscar endereços:", error);
        setPesquisandoEnderecos(false);
      }
    }

    // Buscar última condição de pagamento do cliente (se parâmetro 5 = 'S')
    // Apenas se NÃO estiver em modo de edição
    if (!modoEdicao && schema && cliente.cod_pessoa) {
      try {
        console.log(
          `🔍 Buscando última condição de pagamento do cliente ${cliente.cod_pessoa}...`,
        );
        const resultado = await buscarUltimaCondicaoPagamentoCliente(
          schema,
          cliente.cod_pessoa,
        );

        if (resultado.success && resultado.data) {
          console.log(
            `✅ Condição encontrada: ${resultado.data.des_condicao_pagamento}`,
          );
          setCondicaoSelecionada(resultado.data);

          // Se a condição for automática, calcula as parcelas
          if (resultado.data.ind_tipo_condicao === "A") {
            const hoje = new Date();
            const dia = String(hoje.getDate()).padStart(2, "0");
            const mes = String(hoje.getMonth() + 1).padStart(2, "0");
            const ano = hoje.getFullYear();
            const dataHoje = `${dia}/${mes}/${ano}`;

            // Calcula o total atual
            const total = calcularTotal();

            if (total > 0) {
              const resultadoParcelas = await calcularParcelasAutomaticas(
                schema,
                resultado.data.cod_condicao_pagamento,
                total,
                dataHoje,
              );

              if (resultadoParcelas.success && resultadoParcelas.data) {
                const parcelasConvertidas: Parcela[] =
                  resultadoParcelas.data.map((p) => ({
                    numero: p.numero,
                    dataVencimento: p.dataVencimento,
                    valor: p.valor,
                  }));
                setParcelas(parcelasConvertidas);
              }
            }
          }
        } else {
          console.log(
            `ℹ️ ${resultado.message || "Nenhuma condição de pagamento encontrada"}`,
          );
        }
      } catch (error) {
        console.error("❌ Erro ao buscar condição de pagamento:", error);
      }
    }
  };

  // Limpar cliente selecionado
  const limparCliente = () => {
    setClienteSelecionado(null);
    setEnderecoSelecionado(null);
    setEnderecosCliente([]);
  };

  // Selecionar endereço
  const selecionarEndereco = (endereco: EnderecoCliente) => {
    setEnderecoSelecionado(endereco);
    setModalEnderecoVisible(false);
    console.log(
      `✅ Endereço selecionado: seq_endereco ${endereco.seq_endereco}`,
    );
  };

  // Manipular mudança de data no campo de texto
  const handleDataChange = (text: string) => {
    const formatted = formatDate(text);
    setDataEntrega(formatted);
  };

  // Abrir o seletor de data
  const abrirDatePicker = () => {
    setShowDatePicker(true);
  };

  // Manipular seleção de data no picker
  const handleDateSelect = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // iOS mantém aberto

    if (date) {
      setSelectedDate(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setDataEntrega(`${day}/${month}/${year}`);
    }
  };

  // ========== FUNÇÕES DE ITENS ==========

  // Pesquisar itens
  const handlePesquisarItens = async (termo: string = termoPesquisaItem) => {
    if (!schema || !empresa?.cod_empresa) {
      Alert.alert("Erro", "Schema ou empresa não encontrados.");
      return;
    }

    if (termo.trim().length < 2) {
      setItens([]);
      return;
    }

    try {
      setPesquisandoItens(true);
      const response = await pesquisarItens(schema, empresa.cod_empresa, termo);

      if (response.success && response.data) {
        setItens(response.data);
      } else {
        Alert.alert("Erro", response.message);
        setItens([]);
      }
    } catch (error) {
      console.error("Erro ao pesquisar itens:", error);
      Alert.alert("Erro", "Erro ao pesquisar itens");
      setItens([]);
    } finally {
      setPesquisandoItens(false);
    }
  };

  // Buscar itens ao digitar (com debounce no useEffect)
  const handleTermoPesquisaItemChange = (termo: string) => {
    setTermoPesquisaItem(termo);
  };

  // Abrir modal de pesquisa de item
  const abrirPesquisaItem = async () => {
    setModalItemVisible(true);
    setTermoPesquisaItem("");
    setItens([]);

    // Verificar se existe parâmetro de itens iniciais
    if (schema && empresa?.cod_empresa) {
      try {
        const resultadoParametro = await buscarParametroItensIniciais(schema);

        if (
          resultadoParametro.success &&
          resultadoParametro.data?.quantidade_itens_iniciais &&
          resultadoParametro.data.quantidade_itens_iniciais > 0
        ) {
          const quantidade = resultadoParametro.data.quantidade_itens_iniciais;
          console.log(
            `📦 Carregando ${quantidade} itens iniciais automaticamente...`,
          );

          setPesquisandoItens(true);
          const response = await pesquisarItens(
            schema,
            empresa.cod_empresa,
            "", // termo vazio para buscar todos
            quantidade,
          );

          if (response.success && response.data) {
            setItens(response.data);
            console.log(`✅ ${response.data.length} itens carregados`);
          }
          setPesquisandoItens(false);
        } else {
          console.log(
            "ℹ️ Parâmetro de itens iniciais não configurado - tela vazia",
          );
        }
      } catch (error) {
        console.error("Erro ao carregar itens iniciais:", error);
        setPesquisandoItens(false);
      }
    }
  };

  // Adicionar item ao pedido
  const adicionarItem = (item: Item) => {
    const itemPedido: ItemPedido = {
      ...item,
      quantidade: 1,
      val_total: item.val_preco_venda,
    };

    setItensPedido([...itensPedido, itemPedido]);
    setModalItemVisible(false);
    setTermoPesquisaItem("");
    setItens([]);
    Alert.alert("Sucesso", `${item.des_item} adicionado ao pedido`);
  };

  // Atualizar quantidade de um item
  const atualizarQuantidadeItem = (index: number, novaQuantidade: string) => {
    const qtd = parseFloat(novaQuantidade) || 0;
    const novosItens = [...itensPedido];
    novosItens[index].quantidade = qtd;
    novosItens[index].val_total = qtd * novosItens[index].val_preco_venda;
    setItensPedido(novosItens);
  };

  // Atualizar preço do item durante digitação
  const atualizarPrecoItem = (index: number, novoPrecoTexto: string) => {
    // Armazena o texto sendo digitado
    setPrecosEmEdicao((prev) => ({ ...prev, [index]: novoPrecoTexto }));
  };

  // Finalizar edição de preço (quando sair do campo)
  const calcularMargemAtual = (precoVenda: number, custo: number): number => {
    if (precoVenda <= 0) return 0;
    return ((precoVenda - custo) / precoVenda) * 100;
  };

  const validarMargemItem = (
    item: ItemPedido,
    novoPreco: number,
  ): { valido: boolean; mensagem?: string; isWarning?: boolean } => {
    if (!parametrosPreco || parametrosPreco.permite_alterar_preco !== "S") {
      return { valido: true }; // Se não pode alterar preço, não valida margem
    }

    // Determina qual custo usar baseado no parâmetro
    const custoUtilizado =
      parametrosPreco.tipo_custo === "U"
        ? item.val_custo_unitario
        : item.val_custo_medio;

    // Calcula a margem atual
    const margemAtual = calcularMargemAtual(novoPreco, custoUtilizado);

    // Verifica se está abaixo da margem desejada
    if (
      item.per_margem_desejada > 0 &&
      margemAtual < item.per_margem_desejada
    ) {
      const mensagem = `Margem atual (${margemAtual.toFixed(
        2,
      )}%) está abaixo da margem desejada (${item.per_margem_desejada.toFixed(
        2,
      )}%)`;

      // Se o parâmetro 7 = 'N', apenas avisa mas permite continuar
      if (parametrosPreco.bloquear_margem_baixa === "N") {
        return {
          valido: true,
          mensagem,
          isWarning: true,
        };
      }

      // Se o parâmetro 7 = 'S' (ou não definido), bloqueia
      return {
        valido: false,
        mensagem,
      };
    }

    return { valido: true };
  };

  const finalizarEdicaoPreco = (index: number) => {
    const precoTexto = precosEmEdicao[index] || "0";
    const preco = parseFloat(precoTexto.replace(",", ".")) || 0;

    const item = itensPedido[index];

    // Valida a margem
    const validacao = validarMargemItem(item, preco);

    // Se não é válido E não é apenas aviso, bloqueia
    if (!validacao.valido && !validacao.isWarning) {
      Alert.alert(
        "Margem Abaixo da Desejada",
        validacao.mensagem ||
          "O preço informado está abaixo da margem desejada.",
        [{ text: "OK" }],
      );

      // Remove o texto em edição e mantém o preço original
      setPrecosEmEdicao((prev) => {
        const nova = { ...prev };
        delete nova[index];
        return nova;
      });
      return;
    }

    // Se é um aviso (warning), mostra alerta mas permite continuar
    if (validacao.isWarning) {
      Alert.alert(
        "Atenção: Margem Abaixo da Desejada",
        `${validacao.mensagem}\n\nO item será incluído mesmo assim.`,
        [{ text: "OK" }],
      );
    }

    // Atualiza o preço
    const novosItens = [...itensPedido];
    novosItens[index].val_preco_venda = preco;
    novosItens[index].val_total = novosItens[index].quantidade * preco;
    setItensPedido(novosItens);

    // Remove o texto em edição
    setPrecosEmEdicao((prev) => {
      const nova = { ...prev };
      delete nova[index];
      return nova;
    });
  };

  // Remover item do pedido
  const removerItem = (index: number) => {
    Alert.alert("Confirmar", "Deseja remover este item do pedido?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          const novosItens = [...itensPedido];
          novosItens.splice(index, 1);
          setItensPedido(novosItens);
        },
      },
    ]);
  };

  // Calcular totais
  const calcularSubtotal = () => {
    return itensPedido.reduce((sum, item) => sum + item.val_total, 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const valorDesconto = parseFloat(desconto) || 0;
    const valorAcrescimo = parseFloat(acrescimo) || 0;
    const valorFrete = parseFloat(frete) || 0;

    return subtotal - valorDesconto + valorAcrescimo + valorFrete;
  };

  // ========== FUNÇÕES DE CONDIÇÃO DE PAGAMENTO ==========

  // Pesquisar condições de pagamento
  const handlePesquisarCondicoes = async () => {
    if (!schema) {
      Alert.alert("Erro", "Schema não encontrado. Faça login novamente.");
      return;
    }

    try {
      setPesquisandoCondicoes(true);
      const response = await pesquisarCondicoesPagamento(schema);

      if (response.success && response.data) {
        setCondicoesPagamento(response.data);
      } else {
        Alert.alert("Erro", response.message);
        setCondicoesPagamento([]);
      }
    } catch (error) {
      console.error("Erro ao pesquisar condições:", error);
      Alert.alert("Erro", "Erro ao pesquisar condições de pagamento");
      setCondicoesPagamento([]);
    } finally {
      setPesquisandoCondicoes(false);
    }
  };

  // ===== FUNÇÕES DE TIPO DE COBRANÇA =====

  // Abrir modal de tipos de cobrança
  const abrirSelecionadorTipoCobranca = async () => {
    if (!schema) {
      Alert.alert("Erro", "Schema não disponível");
      return;
    }

    try {
      setCarregandoTiposCobranca(true);
      setModalTipoCobrancaVisible(true);

      const resultado = await listarTiposCobranca(schema);

      if (resultado.success && resultado.data) {
        setTiposCobranca(resultado.data);
      } else {
        Alert.alert("Erro", resultado.message);
        setTiposCobranca([]);
      }
    } catch (error) {
      console.error("Erro ao listar tipos de cobrança:", error);
      Alert.alert("Erro", "Erro ao carregar tipos de cobrança");
    } finally {
      setCarregandoTiposCobranca(false);
    }
  };

  // Selecionar tipo de cobrança
  const selecionarTipoCobranca = (tipo: TipoCobranca) => {
    setTipoCobrancaSelecionado(tipo);
    setModalTipoCobrancaVisible(false);
    console.log(`✅ Tipo de cobrança selecionado: ${tipo.des_tipo_cobranca}`);
  };

  // Limpar tipo de cobrança
  const limparTipoCobranca = () => {
    setTipoCobrancaSelecionado(null);
  };

  // ===== FUNÇÕES DE CONDIÇÃO DE PAGAMENTO =====

  // Abrir modal de condições
  const abrirPesquisaCondicao = async () => {
    setModalCondicaoVisible(true);
    await handlePesquisarCondicoes();
  };

  // Selecionar condição e abrir modal de parcelas
  const selecionarCondicao = async (condicao: CondicaoPagamento) => {
    setCondicaoSelecionada(condicao);
    setModalCondicaoVisible(false);

    // Verifica se a condição é automática
    if (condicao.ind_tipo_condicao === "A") {
      // Condição automática: calcula parcelas para preview
      try {
        setLoading(true);
        const total = calcularTotal();

        // Usa data atual como referência para cálculo das parcelas
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, "0");
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const ano = hoje.getFullYear();
        const dataHoje = `${dia}/${mes}/${ano}`;

        const resultado = await calcularParcelasAutomaticas(
          schema,
          condicao.cod_condicao_pagamento,
          total,
          dataHoje,
        );

        if (resultado.success && resultado.data) {
          // Converte ParcelaCalculada[] para Parcela[]
          const parcelasConvertidas: Parcela[] = resultado.data.map((p) => ({
            numero: p.numero,
            dataVencimento: p.dataVencimento,
            valor: p.valor,
          }));
          setParcelas(parcelasConvertidas);

          Alert.alert(
            "Condição Automática",
            `${parcelasConvertidas.length} parcela(s) calculada(s) automaticamente. Você pode visualizar as parcelas abaixo.`,
            [{ text: "OK" }],
          );
        } else {
          // Se não conseguir calcular, apenas limpa parcelas e avisa
          setParcelas([]);
          Alert.alert(
            "Condição Automática",
            "Esta condição de pagamento possui cálculo automático de parcelas. As parcelas serão geradas automaticamente pelo sistema quando o pedido for salvo.",
            [{ text: "OK" }],
          );
        }
      } catch (error) {
        console.error("Erro ao calcular parcelas automáticas:", error);
        setParcelas([]);
        Alert.alert(
          "Aviso",
          "Não foi possível calcular as parcelas neste momento. As parcelas serão geradas automaticamente quando o pedido for salvo.",
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Condição manual: abrir modal de configuração de parcelas
      setModalParcelasVisible(true);
    }
  };

  // Calcular parcelas
  const calcularParcelas = () => {
    const total = calcularTotal();
    const numParcelas = parseInt(numeroParcelas) || 1;

    if (numParcelas < 1) {
      Alert.alert("Erro", "Número de parcelas deve ser maior que zero");
      return;
    }

    if (!dataVencimentoInicial) {
      Alert.alert("Erro", "Informe a data do primeiro vencimento");
      return;
    }

    const valorParcela = total / numParcelas;
    const novasParcelas: Parcela[] = [];

    // Parse da data inicial
    const [dia, mes, ano] = dataVencimentoInicial.split("/").map(Number);
    const dataBase = new Date(ano, mes - 1, dia);

    for (let i = 0; i < numParcelas; i++) {
      // Calcular data de vencimento (adicionar meses)
      const dataVenc = new Date(dataBase);
      dataVenc.setMonth(dataBase.getMonth() + i);

      const day = String(dataVenc.getDate()).padStart(2, "0");
      const month = String(dataVenc.getMonth() + 1).padStart(2, "0");
      const year = dataVenc.getFullYear();

      novasParcelas.push({
        numero: i + 1,
        dataVencimento: `${day}/${month}/${year}`,
        valor:
          i === numParcelas - 1
            ? total - valorParcela * (numParcelas - 1)
            : valorParcela, // Ajuste na última parcela
      });
    }

    setParcelas(novasParcelas);
  };

  // Confirmar parcelas
  const confirmarParcelas = () => {
    if (parcelas.length === 0) {
      Alert.alert("Erro", "Calcule as parcelas antes de confirmar");
      return;
    }

    setModalParcelasVisible(false);
    Alert.alert(
      "Sucesso",
      `Condição de pagamento configurada: ${parcelas.length} parcela(s)`,
    );
  };

  // Limpar condição de pagamento
  const limparCondicao = () => {
    setCondicaoSelecionada(null);
    setParcelas([]);
    setNumeroParcelas("1");
    setDataVencimentoInicial("");
  };

  // Manipular data de vencimento
  const handleDataVencimentoChange = (text: string) => {
    const formatted = formatDate(text);
    setDataVencimentoInicial(formatted);
  };

  // Abrir date picker de vencimento
  const abrirDatePickerVencimento = () => {
    setShowDatePickerVencimento(true);
  };

  // Manipular seleção de data de vencimento
  const handleDateSelectVencimento = (event: any, date?: Date) => {
    setShowDatePickerVencimento(Platform.OS === "ios");

    if (date) {
      setSelectedDateVencimento(date);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      setDataVencimentoInicial(`${day}/${month}/${year}`);
    }
  };

  const handleSubmit = async () => {
    // Validações
    if (!clienteSelecionado) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }

    if (!dataEntrega.trim()) {
      Alert.alert("Erro", "Informe a data de entrega");
      return;
    }

    if (itensPedido.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um item ao pedido");
      return;
    }

    // Validar se todos os itens têm quantidade > 0
    const itemSemQuantidade = itensPedido.find((item) => item.quantidade <= 0);
    if (itemSemQuantidade) {
      Alert.alert("Erro", "Todos os itens devem ter quantidade maior que zero");
      return;
    }

    // Valida margem de todos os itens
    if (parametrosPreco?.permite_alterar_preco === "S") {
      for (let i = 0; i < itensPedido.length; i++) {
        const item = itensPedido[i];
        const validacao = validarMargemItem(item, item.val_preco_venda);
        // Só bloqueia se não for válido E não for apenas aviso
        if (!validacao.valido && !validacao.isWarning) {
          Alert.alert(
            "Margem Abaixo da Desejada",
            `Item ${item.des_item}:\n${validacao.mensagem}\n\nNão é possível salvar o pedido.`,
            [{ text: "OK" }],
          );
          return;
        }
      }
    }

    // Validar condição de pagamento
    if (!condicaoSelecionada) {
      Alert.alert("Erro", "Selecione uma condição de pagamento");
      return;
    }

    // Validar parcelas apenas se a condição for manual
    if (
      condicaoSelecionada.ind_tipo_condicao !== "A" &&
      parcelas.length === 0
    ) {
      Alert.alert("Erro", "Configure as parcelas da condição de pagamento");
      return;
    }

    // RECALCULAR PARCELAS ANTES DE SALVAR (apenas se tiver parcelas manuais)
    let parcelasAtualizadas = parcelas;
    if (parcelas.length > 0 && condicaoSelecionada.ind_tipo_condicao !== "A") {
      // Verifica se todas as parcelas têm data de vencimento antes de recalcular
      const todasPossuemData = parcelas.every(
        (p) => p.dataVencimento && p.dataVencimento.trim() !== "",
      );

      if (todasPossuemData) {
        const totalAtual = calcularTotal();
        parcelasAtualizadas = parcelas.map((parcela) => ({
          numero: parcela.numero,
          dataVencimento: parcela.dataVencimento,
          valor: totalAtual / parcelas.length,
        }));
        setParcelas(parcelasAtualizadas);
      } else {
        console.warn("Parcelas sem data de vencimento - não será recalculado");
      }
    }

    try {
      setLoading(true);

      // Preparar dados do pedido
      const pedido = {
        cliente: clienteSelecionado,
        dataEntrega,
        itens: itensPedido,
        subtotal: calcularSubtotal(),
        desconto: parseFloat(desconto) || 0,
        acrescimo: parseFloat(acrescimo) || 0,
        frete: parseFloat(frete) || 0,
        total: calcularTotal(),
        observacao,
        condicaoPagamento: condicaoSelecionada,
        parcelas: parcelasAtualizadas,
      };

      console.log("Pedido a ser enviado:", pedido);
      console.log(
        "Parcelas a serem enviadas (RECALCULADAS):",
        JSON.stringify(parcelasAtualizadas, null, 2),
      );

      // Chamar API para salvar ou atualizar o pedido
      let resultado;

      if (modoEdicao && pedidoParaEditar) {
        // Atualizar pedido existente
        resultado = await atualizarPedido({
          seq_pedido: pedidoParaEditar.seq_pedido,
          schema,
          cod_empresa: empresa.cod_empresa,
          usuario,
          cliente: clienteSelecionado,
          seq_endereco: enderecoSelecionado?.seq_endereco,
          cod_tipo_cobranca: tipoCobrancaSelecionado?.cod_tipo_cobranca,
          dataEntrega,
          itens: itensPedido,
          subtotal: calcularSubtotal(),
          desconto: parseFloat(desconto) || 0,
          acrescimo: parseFloat(acrescimo) || 0,
          frete: parseFloat(frete) || 0,
          total: calcularTotal(),
          observacao,
          condicaoPagamento: condicaoSelecionada,
          parcelas: parcelasAtualizadas,
        });
      } else {
        // Criar novo pedido
        resultado = await criarPedido({
          schema,
          cod_empresa: empresa.cod_empresa,
          usuario,
          cliente: clienteSelecionado,
          seq_endereco: enderecoSelecionado?.seq_endereco,
          cod_tipo_cobranca: tipoCobrancaSelecionado?.cod_tipo_cobranca,
          dataEntrega,
          itens: itensPedido,
          subtotal: calcularSubtotal(),
          desconto: parseFloat(desconto) || 0,
          acrescimo: parseFloat(acrescimo) || 0,
          frete: parseFloat(frete) || 0,
          total: calcularTotal(),
          observacao,
          condicaoPagamento: condicaoSelecionada,
          parcelas: parcelasAtualizadas,
        });
      }

      if (!resultado.success) {
        Alert.alert(
          "Erro",
          resultado.message ||
            (modoEdicao
              ? "Erro ao atualizar pedido"
              : "Erro ao cadastrar pedido"),
        );
        return;
      }

      Alert.alert(
        "Sucesso",
        modoEdicao
          ? `Pedido nº ${pedidoParaEditar.seq_pedido} atualizado com sucesso!`
          : `Pedido nº ${resultado.data?.seq_pedido} cadastrado com sucesso!`,
        [
          {
            text: "OK",
            onPress: () => {
              if (modoEdicao) {
                // Se estiver editando, apenas voltar (a tela de detalhes recarregará)
                navigation.goBack();
              } else {
                // Se for novo pedido, limpar campos e voltar
                setClienteSelecionado(null);
                setEnderecoSelecionado(null);
                setEnderecosCliente([]);
                setItensPedido([]);
                setDesconto("");
                setAcrescimo("");
                setFrete("");
                setObservacao("");
                setDataEntrega("");
                setCondicaoSelecionada(null);
                setParcelas([]);
                setNumeroParcelas("1");
                setDataVencimentoInicial("");
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Erro", "Erro ao cadastrar pedido");
      console.error("Erro ao cadastrar pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {modoEdicao ? "Editar Pedido" : "Novo Pedido"}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Dados do Pedido</Text>

            {/* Empresa Selecionada */}
            {empresa && (
              <View style={styles.empresaCard}>
                <Text style={styles.empresaLabel}>Empresa:</Text>
                <Text style={styles.empresaNome}>
                  {empresa.nom_fantasia || empresa.nom_razao_social}
                </Text>
              </View>
            )}

            {/* Botão de Pesquisa Cliente - DESTAQUE */}
            {!clienteSelecionado ? (
              <TouchableOpacity
                style={styles.searchButtonLarge}
                onPress={abrirPesquisaCliente}
                disabled={loading}
              >
                <Text style={styles.searchButtonLargeText}>
                  🔍 Pesquisar Cliente
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Cliente Selecionado */}
            {clienteSelecionado ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente *</Text>
                <View style={styles.clienteCard}>
                  <View style={styles.clienteInfo}>
                    <Text style={styles.clienteNome}>
                      {clienteSelecionado.cod_pessoa} -{" "}
                      {clienteSelecionado.nom_pessoa}
                    </Text>
                    <Text style={styles.clienteDetalhe}>
                      CNPJ: {clienteSelecionado.num_cnpj}
                    </Text>
                    {enderecoSelecionado && (
                      <Text style={styles.enderecoSelecionadoLabel}>
                        📍 Endereço de Entrega:
                      </Text>
                    )}
                    <Text style={styles.clienteDetalhe}>
                      {enderecoSelecionado
                        ? enderecoSelecionado.des_logradouro +
                          (enderecoSelecionado.des_complemento
                            ? `, ${enderecoSelecionado.des_complemento}`
                            : "")
                        : clienteSelecionado.des_endereco}
                    </Text>
                    <Text style={styles.clienteDetalhe}>
                      {enderecoSelecionado
                        ? `${enderecoSelecionado.nom_bairro} - ${enderecoSelecionado.nom_cidade}`
                        : clienteSelecionado.nom_cidade}
                    </Text>
                    {enderecoSelecionado?.num_cep && (
                      <Text style={styles.clienteDetalhe}>
                        CEP: {enderecoSelecionado.num_cep}
                      </Text>
                    )}
                    {enderecosCliente.length >= 2 && (
                      <TouchableOpacity
                        style={styles.alterarEnderecoButton}
                        onPress={() => setModalEnderecoVisible(true)}
                        disabled={loading}
                      >
                        <Text style={styles.alterarEnderecoButtonText}>
                          🔄 Alterar Endereço
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={limparCliente}
                    disabled={loading}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Data de Entrega */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Entrega *</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.mediumGray}
                  value={dataEntrega}
                  onChangeText={handleDataChange}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={abrirDatePicker}
                  disabled={loading}
                >
                  <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DateTimePicker Android */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateSelect}
                locale="pt-BR"
              />
            )}

            {/* Modal DatePicker iOS */}
            {showDatePicker && Platform.OS === "ios" && (
              <Modal
                visible={showDatePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.datePickerModalContent}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerCancelText}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>
                        Selecionar Data
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const day = String(selectedDate.getDate()).padStart(
                            2,
                            "0",
                          );
                          const month = String(
                            selectedDate.getMonth() + 1,
                          ).padStart(2, "0");
                          const year = selectedDate.getFullYear();
                          setDataEntrega(`${day}/${month}/${year}`);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={styles.datePickerConfirmText}>
                          Confirmar
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateSelect}
                      locale="pt-BR"
                      style={styles.iosDatePicker}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {/* Botão Pesquisar Item */}
            <TouchableOpacity
              style={styles.searchButtonLarge}
              onPress={abrirPesquisaItem}
              disabled={loading}
            >
              <Text style={styles.searchButtonLargeText}>
                ➕ Adicionar Item ao Pedido
              </Text>
            </TouchableOpacity>

            {/* Lista de Itens Adicionados */}
            {itensPedido.length > 0 && (
              <View style={styles.itensPedidoSection}>
                <Text style={styles.itensPedidoTitle}>
                  Itens do Pedido ({itensPedido.length})
                </Text>
                {itensPedido.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemCodigo}>
                          #{item.cod_item} | {item.cod_barra}
                        </Text>
                        <Text style={styles.itemNome}>{item.des_item}</Text>
                        <Text style={styles.itemUnidade}>
                          Unidade: {item.des_unidade}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeItemButton}
                        onPress={() => removerItem(index)}
                        disabled={loading}
                      >
                        <Text style={styles.removeItemButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.itemValores}>
                      <View style={styles.itemValoresRow}>
                        <View style={styles.itemQuantidadeContainer}>
                          <Text style={styles.itemValorLabel}>Qtd:</Text>
                          <TextInput
                            style={styles.itemQuantidadeInput}
                            value={item.quantidade.toString()}
                            onChangeText={(text) =>
                              atualizarQuantidadeItem(index, text)
                            }
                            keyboardType="decimal-pad"
                            editable={!loading}
                          />
                        </View>
                        <View style={styles.itemPrecoContainer}>
                          <Text style={styles.itemValorLabel}>Preço:</Text>
                          {parametrosPreco?.permite_alterar_preco === "S" ? (
                            <TextInput
                              style={styles.itemPrecoInput}
                              value={
                                precosEmEdicao[index] !== undefined
                                  ? precosEmEdicao[index]
                                  : item.val_preco_venda.toFixed(2)
                              }
                              onChangeText={(text) =>
                                atualizarPrecoItem(index, text)
                              }
                              onBlur={() => finalizarEdicaoPreco(index)}
                              keyboardType="decimal-pad"
                              editable={!loading}
                            />
                          ) : (
                            <Text
                              style={styles.itemPrecoValor}
                              numberOfLines={1}
                            >
                              {formatCurrency(item.val_preco_venda)}
                            </Text>
                          )}
                        </View>
                      </View>
                      {parametrosPreco && (
                        <View style={styles.itemCustoRow}>
                          <Text style={styles.itemCustoLabel}>
                            Custo{" "}
                            {parametrosPreco.tipo_custo === "U"
                              ? "Unit."
                              : "Médio"}
                            :
                          </Text>
                          <Text style={styles.itemCustoValor}>
                            {formatCurrency(
                              parametrosPreco.tipo_custo === "U"
                                ? item.val_custo_unitario
                                : item.val_custo_medio,
                            )}
                          </Text>
                        </View>
                      )}
                      {/* Aviso de margem baixa (quando parâmetro 7 = 'N') */}
                      {parametrosPreco &&
                        parametrosPreco.bloquear_margem_baixa === "N" &&
                        item.per_margem_desejada > 0 &&
                        calcularMargemAtual(
                          item.val_preco_venda,
                          parametrosPreco.tipo_custo === "U"
                            ? item.val_custo_unitario
                            : item.val_custo_medio,
                        ) < item.per_margem_desejada && (
                          <View style={styles.itemMargemBaixaWarning}>
                            <Text style={styles.itemMargemBaixaIcon}>⚠️</Text>
                            <Text style={styles.itemMargemBaixaTexto}>
                              Margem abaixo do desejado
                            </Text>
                          </View>
                        )}
                      <View style={styles.itemTotalRow}>
                        <Text style={styles.itemTotalLabel}>Total Item:</Text>
                        <Text style={styles.itemTotalValor}>
                          {formatCurrency(item.val_total)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Valores Adicionais */}
            {itensPedido.length > 0 && (
              <View style={styles.valoresAdicionaisSection}>
                <View style={styles.inputRow}>
                  <View style={styles.inputSmall}>
                    <Text style={styles.label}>Desconto (R$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0,00"
                      placeholderTextColor={colors.mediumGray}
                      value={desconto}
                      onChangeText={setDesconto}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                  </View>
                  <View style={styles.inputSmall}>
                    <Text style={styles.label}>Acréscimo (R$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0,00"
                      placeholderTextColor={colors.mediumGray}
                      value={acrescimo}
                      onChangeText={setAcrescimo}
                      keyboardType="decimal-pad"
                      editable={!loading}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Frete (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0,00"
                    placeholderTextColor={colors.mediumGray}
                    value={frete}
                    onChangeText={setFrete}
                    keyboardType="decimal-pad"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* Observação */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações sobre o pedido"
                placeholderTextColor={colors.mediumGray}
                value={observacao}
                onChangeText={setObservacao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Totais */}
            {itensPedido.length > 0 && (
              <View style={styles.totaisContainer}>
                <View style={styles.totaisRow}>
                  <Text style={styles.totaisLabel}>Subtotal:</Text>
                  <Text style={styles.totaisValor}>
                    {formatCurrency(calcularSubtotal())}
                  </Text>
                </View>
                {parseFloat(desconto || "0") > 0 && (
                  <View style={styles.totaisRow}>
                    <Text style={styles.totaisLabel}>- Desconto:</Text>
                    <Text style={styles.totaisValor}>
                      {formatCurrency(
                        parseFloat(desconto.replace(",", ".") || "0"),
                      )}
                    </Text>
                  </View>
                )}
                {parseFloat(acrescimo || "0") > 0 && (
                  <View style={styles.totaisRow}>
                    <Text style={styles.totaisLabel}>+ Acréscimo:</Text>
                    <Text style={styles.totaisValor}>
                      {formatCurrency(
                        parseFloat(acrescimo.replace(",", ".") || "0"),
                      )}
                    </Text>
                  </View>
                )}
                {parseFloat(frete || "0") > 0 && (
                  <View style={styles.totaisRow}>
                    <Text style={styles.totaisLabel}>+ Frete:</Text>
                    <Text style={styles.totaisValor}>
                      {formatCurrency(
                        parseFloat(frete.replace(",", ".") || "0"),
                      )}
                    </Text>
                  </View>
                )}
                <View style={styles.totalFinalContainer}>
                  <Text style={styles.totalFinalLabel}>TOTAL:</Text>
                  <Text style={styles.totalFinalValor}>
                    {formatCurrency(calcularTotal())}
                  </Text>
                </View>
              </View>
            )}

            {/* Botão Adicionar Tipo de Cobrança */}
            {itensPedido.length > 0 && !tipoCobrancaSelecionado && (
              <TouchableOpacity
                style={styles.searchButtonLarge}
                onPress={abrirSelecionadorTipoCobranca}
                disabled={loading}
              >
                <Text style={styles.searchButtonLargeText}>
                  💰 Adicionar Tipo de Cobrança
                </Text>
              </TouchableOpacity>
            )}

            {/* Tipo de Cobrança Selecionado */}
            {tipoCobrancaSelecionado && (
              <View style={styles.condicaoSection}>
                <View style={styles.condicaoHeader}>
                  <Text style={styles.condicaoLabel}>Tipo de Cobrança</Text>
                  <TouchableOpacity
                    style={styles.trocarCondicaoButton}
                    onPress={abrirSelecionadorTipoCobranca}
                    disabled={loading}
                  >
                    <Text style={styles.trocarCondicaoText}>Alterar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.condicaoCard}>
                  <Text style={styles.condicaoNome}>
                    {tipoCobrancaSelecionado.des_tipo_cobranca}
                  </Text>
                  <Text style={styles.condicaoDetalhe}>
                    Código: {tipoCobrancaSelecionado.cod_tipo_cobranca}
                  </Text>
                </View>
              </View>
            )}

            {/* Botão Adicionar Condição de Pagamento */}
            {itensPedido.length > 0 && !condicaoSelecionada && (
              <TouchableOpacity
                style={styles.searchButtonLarge}
                onPress={abrirPesquisaCondicao}
                disabled={loading}
              >
                <Text style={styles.searchButtonLargeText}>
                  💳 Adicionar Condição de Pagamento
                </Text>
              </TouchableOpacity>
            )}

            {/* Condição de Pagamento Selecionada */}
            {condicaoSelecionada && (
              <View style={styles.condicaoSection}>
                <View style={styles.condicaoHeader}>
                  <Text style={styles.condicaoLabel}>
                    Condição de Pagamento
                  </Text>
                  <TouchableOpacity
                    style={styles.trocarCondicaoButton}
                    onPress={limparCondicao}
                    disabled={loading}
                  >
                    <Text style={styles.trocarCondicaoText}>Alterar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.condicaoCard}>
                  <Text style={styles.condicaoNome}>
                    {condicaoSelecionada.des_condicao_pagamento}
                  </Text>
                  <Text style={styles.condicaoDetalhe}>
                    Código: {condicaoSelecionada.cod_condicao_pagamento}
                  </Text>
                  <Text style={styles.condicaoDetalhe}>
                    Tipo:{" "}
                    {condicaoSelecionada.ind_tipo_condicao === "A"
                      ? "Automática"
                      : "Manual"}
                  </Text>
                  {parcelas.length > 0 && (
                    <>
                      <View
                        style={[
                          styles.automaticaBadge,
                          condicaoSelecionada.ind_tipo_condicao !== "A" && {
                            backgroundColor: "#e3f2fd",
                            borderLeftColor: "#1976d2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.automaticaText,
                            condicaoSelecionada.ind_tipo_condicao !== "A" && {
                              color: "#0d47a1",
                            },
                          ]}
                        >
                          {condicaoSelecionada.ind_tipo_condicao === "A"
                            ? "✓ Parcelas calculadas automaticamente"
                            : "✓ Parcelas configuradas"}
                        </Text>
                      </View>
                      <Text style={styles.condicaoDetalhe}>
                        Parcelas: {parcelas.length}x
                      </Text>
                      <View style={styles.parcelasResumo}>
                        {parcelas.map((parcela) => {
                          // Debug: Log de cada parcela antes de renderizar
                          console.log(
                            `📌 Parcela ${parcela.numero}:`,
                            "Data:",
                            parcela.dataVencimento,
                            "Valor:",
                            parcela.valor,
                          );
                          return (
                            <View
                              key={parcela.numero}
                              style={styles.parcelaItem}
                            >
                              <Text style={styles.parcelaTexto}>
                                {parcela.numero}ª:{" "}
                                {parcela.dataVencimento || "(sem data)"} -{" "}
                                {formatCurrency(parcela.valor)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {modoEdicao ? "Atualizar Pedido" : "Salvar Pedido"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal Pesquisar Item */}
        <Modal
          visible={modalItemVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalItemVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pesquisar Item</Text>
                <TouchableOpacity
                  onPress={() => setModalItemVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  ref={itemSearchInputRef}
                  style={styles.searchInput}
                  placeholder="Digite código, código de barras ou descrição..."
                  placeholderTextColor={colors.mediumGray}
                  value={termoPesquisaItem}
                  onChangeText={handleTermoPesquisaItemChange}
                  autoFocus={true}
                  returnKeyType="search"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.searchIconButton}
                  onPress={handlePesquisarItens}
                  disabled={
                    pesquisandoItens || termoPesquisaItem.trim().length < 2
                  }
                >
                  <Text style={styles.searchIcon}>🔍</Text>
                </TouchableOpacity>
              </View>

              {pesquisandoItens ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Pesquisando itens...</Text>
                </View>
              ) : (
                <FlatList
                  data={itens}
                  keyExtractor={(item, index) => `${item.cod_item}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemResultCard}
                      onPress={() => adicionarItem(item)}
                    >
                      <View style={styles.itemResultInfo}>
                        <Text style={styles.itemResultCodigo}>
                          #{item.cod_item} | {item.cod_barra || "S/C"}
                        </Text>
                        <Text style={styles.itemResultNome}>
                          {item.des_item}
                        </Text>
                        <View style={styles.itemResultDetalhes}>
                          <Text style={styles.itemResultUnidade}>
                            Un: {item.des_unidade}
                          </Text>
                          <Text style={styles.itemResultPreco}>
                            {formatCurrency(item.val_preco_venda)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {termoPesquisaItem.trim().length < 2
                          ? "Digite pelo menos 2 caracteres para pesquisar"
                          : "Nenhum item encontrado"}
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Pesquisa de Cliente */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pesquisar Cliente</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Campo de Pesquisa */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite nome, CNPJ ou código para pesquisar..."
                  placeholderTextColor={colors.mediumGray}
                  value={termoPesquisa}
                  onChangeText={handleTermoPesquisaChange}
                  returnKeyType="search"
                  autoFocus
                />
              </View>

              {/* Contador de Resultados */}
              {!pesquisando && clientes.length > 0 && (
                <View style={styles.resultCountContainer}>
                  <Text style={styles.resultCountText}>
                    {totalClientes > 0
                      ? `${clientes.length} de ${totalClientes} cliente(s) ${
                          hasMore ? "- role para carregar mais" : ""
                        }`
                      : `${clientes.length} cliente(s) encontrado(s)`}
                  </Text>
                </View>
              )}

              {/* Indicador de carregamento */}
              {pesquisando && clientes.length === 0 && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando clientes...</Text>
                </View>
              )}

              {/* Lista de Resultados */}
              {!pesquisando && (
                <FlatList
                  data={clientes}
                  keyExtractor={(item, index) =>
                    `cliente-${item.cod_pessoa}-${index}`
                  }
                  style={styles.resultsList}
                  contentContainerStyle={styles.resultsContent}
                  onEndReached={carregarMaisClientes}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                    carregandoMais ? (
                      <View style={styles.footerLoader}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                        <Text style={styles.footerLoaderText}>
                          Carregando mais clientes...
                        </Text>
                      </View>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.clienteItem}
                      onPress={() => selecionarCliente(item)}
                    >
                      <View style={styles.clienteItemContent}>
                        <Text style={styles.clienteItemNome}>
                          {item.cod_pessoa} - {item.nom_pessoa}
                        </Text>
                        <Text style={styles.clienteItemDetalhe}>
                          CNPJ: {item.num_cnpj}
                        </Text>
                        <Text style={styles.clienteItemDetalhe}>
                          {item.des_endereco}
                        </Text>
                        <Text style={styles.clienteItemDetalhe}>
                          {item.nom_cidade}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {termoPesquisa.length >= 2
                          ? "Nenhum cliente encontrado"
                          : termoPesquisa.length > 0
                            ? "Digite pelo menos 2 caracteres para pesquisar"
                            : "Digite nome, CNPJ ou código para buscar clientes"}
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Endereço */}
        <Modal
          visible={modalEnderecoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalEnderecoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Endereço</Text>
                <TouchableOpacity
                  onPress={() => setModalEnderecoVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {pesquisandoEnderecos ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Carregando endereços...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={enderecosCliente}
                  keyExtractor={(item) => item.seq_endereco.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.enderecoItem}
                      onPress={() => selecionarEndereco(item)}
                    >
                      <View style={styles.enderecoItemContent}>
                        <Text style={styles.enderecoItemLogradouro}>
                          {item.des_logradouro}
                        </Text>
                        {item.des_complemento ? (
                          <Text style={styles.enderecoItemDetalhe}>
                            Complemento: {item.des_complemento}
                          </Text>
                        ) : null}
                        <Text style={styles.enderecoItemDetalhe}>
                          {item.nom_bairro} - {item.nom_cidade}
                        </Text>
                        <Text style={styles.enderecoItemDetalhe}>
                          CEP: {item.num_cep}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Nenhum endereço encontrado para este cliente
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Tipo de Cobrança */}
        <Modal
          visible={modalTipoCobrancaVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalTipoCobrancaVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Selecionar Tipo de Cobrança
                </Text>
                <TouchableOpacity
                  onPress={() => setModalTipoCobrancaVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {carregandoTiposCobranca ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Carregando tipos de cobrança...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={tiposCobranca}
                  keyExtractor={(item) => item.cod_tipo_cobranca.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.condicaoItem}
                      onPress={() => selecionarTipoCobranca(item)}
                    >
                      <View style={styles.condicaoItemContent}>
                        <Text style={styles.condicaoItemNome}>
                          {item.des_tipo_cobranca}
                        </Text>
                        <Text style={styles.condicaoItemDetalhe}>
                          Código: {item.cod_tipo_cobranca}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Nenhum tipo de cobrança encontrado
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Condição de Pagamento */}
        <Modal
          visible={modalCondicaoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalCondicaoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Condição de Pagamento</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalCondicaoVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Loading */}
              {pesquisandoCondicoes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Carregando condições...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={condicoesPagamento}
                  keyExtractor={(item) =>
                    item.cod_condicao_pagamento.toString()
                  }
                  style={styles.resultsList}
                  contentContainerStyle={styles.resultsContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.condicaoItem}
                      onPress={() => selecionarCondicao(item)}
                    >
                      <View style={styles.condicaoItemContent}>
                        <Text style={styles.condicaoItemNome}>
                          {item.des_condicao_pagamento}
                        </Text>
                        <Text style={styles.condicaoItemDetalhe}>
                          Código: {item.cod_condicao_pagamento}
                        </Text>
                        <Text style={styles.condicaoItemDetalhe}>
                          Tipo: {item.ind_tipo_condicao}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Nenhuma condição de pagamento cadastrada
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Configuração de Parcelas */}
        <Modal
          visible={modalParcelasVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalParcelasVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentSmall}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurar Parcelas</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalParcelasVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {condicaoSelecionada && (
                  <View style={styles.condicaoSelecionadaInfo}>
                    <Text style={styles.condicaoSelecionadaNome}>
                      {condicaoSelecionada.des_condicao_pagamento}
                    </Text>
                    <Text style={styles.totalParcelar}>
                      Total a parcelar: {formatCurrency(calcularTotal())}
                    </Text>
                  </View>
                )}

                {/* Número de Parcelas */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Número de Parcelas *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 1, 2, 3..."
                    placeholderTextColor={colors.mediumGray}
                    value={numeroParcelas}
                    onChangeText={setNumeroParcelas}
                    keyboardType="numeric"
                  />
                </View>

                {/* Data do Primeiro Vencimento */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Data do Primeiro Vencimento *
                  </Text>
                  <View style={styles.dateInputContainer}>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.mediumGray}
                      value={dataVencimentoInicial}
                      onChangeText={handleDataVencimentoChange}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={abrirDatePickerVencimento}
                    >
                      <Text style={styles.calendarIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DatePicker Android */}
                {showDatePickerVencimento && Platform.OS === "android" && (
                  <DateTimePicker
                    value={selectedDateVencimento}
                    mode="date"
                    display="default"
                    onChange={handleDateSelectVencimento}
                    locale="pt-BR"
                  />
                )}

                {/* Modal DatePicker iOS */}
                {showDatePickerVencimento && Platform.OS === "ios" && (
                  <Modal
                    visible={showDatePickerVencimento}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowDatePickerVencimento(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.datePickerModalContent}>
                        <View style={styles.datePickerHeader}>
                          <TouchableOpacity
                            onPress={() => setShowDatePickerVencimento(false)}
                          >
                            <Text style={styles.datePickerCancelText}>
                              Cancelar
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.datePickerTitle}>
                            Selecionar Data
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const day = String(
                                selectedDateVencimento.getDate(),
                              ).padStart(2, "0");
                              const month = String(
                                selectedDateVencimento.getMonth() + 1,
                              ).padStart(2, "0");
                              const year = selectedDateVencimento.getFullYear();
                              setDataVencimentoInicial(
                                `${day}/${month}/${year}`,
                              );
                              setShowDatePickerVencimento(false);
                            }}
                          >
                            <Text style={styles.datePickerConfirmText}>
                              Confirmar
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDateVencimento}
                          mode="date"
                          display="spinner"
                          onChange={handleDateSelectVencimento}
                          locale="pt-BR"
                          style={styles.iosDatePicker}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {/* Botão Calcular */}
                <TouchableOpacity
                  style={styles.calcularButton}
                  onPress={calcularParcelas}
                >
                  <Text style={styles.calcularButtonText}>
                    Calcular Parcelas
                  </Text>
                </TouchableOpacity>

                {/* Lista de Parcelas Calculadas */}
                {parcelas.length > 0 && (
                  <View style={styles.parcelasCalculadas}>
                    <Text style={styles.parcelasTitle}>
                      Parcelas Calculadas:
                    </Text>
                    {parcelas.map((parcela) => (
                      <View
                        key={parcela.numero}
                        style={styles.parcelaCalculadaItem}
                      >
                        <Text style={styles.parcelaCalculadaNumero}>
                          Parcela {parcela.numero}:
                        </Text>
                        <Text style={styles.parcelaCalculadaInfo}>
                          Vencimento: {parcela.dataVencimento}
                        </Text>
                        <Text style={styles.parcelaCalculadaValor}>
                          Valor: {formatCurrency(parcela.valor)}
                        </Text>
                      </View>
                    ))}

                    {/* Botão Confirmar */}
                    <TouchableOpacity
                      style={styles.confirmarButton}
                      onPress={confirmarParcelas}
                    >
                      <Text style={styles.confirmarButtonText}>
                        Confirmar Parcelas
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 14,
  },
  // Card da empresa selecionada (compacto)
  empresaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  empresaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.darkGray,
    marginRight: 6,
  },
  empresaNome: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary,
    flex: 1,
  },
  // Botão de pesquisa GRANDE em destaque
  searchButtonLarge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButtonLargeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  calendarButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  calendarIcon: {
    fontSize: 22,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos do botão de pesquisa
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos do card de cliente selecionado
  clienteCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  clienteDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  enderecoSelecionadoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 6,
    marginBottom: 4,
  },
  alterarEnderecoButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: "flex-start",
  },
  alterarEnderecoButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: colors.error,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: "100%",
    height: "85%",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  resultCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.lightGray,
  },
  resultCountText: {
    fontSize: 13,
    color: colors.darkGray,
    fontWeight: "600",
  },
  searchIconButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconText: {
    fontSize: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.darkGray,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.darkGray,
  },
  resultsList: {
    flex: 1,
    minHeight: 200,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  clienteItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clienteItemContent: {
    flex: 1,
  },
  clienteItemNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  clienteItemDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.mediumGray,
    textAlign: "center",
  },
  // Estilos do modal de endereço
  enderecoItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  enderecoItemContent: {
    flex: 1,
  },
  enderecoItemLogradouro: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  enderecoItemDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  // Estilos do botão de adicionar item
  searchButtonLarge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  searchButtonLargeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos da seção de itens do pedido
  itensPedidoSection: {
    marginBottom: 16,
  },
  itensPedidoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemCodigo: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  itemNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  itemUnidade: {
    fontSize: 13,
    color: colors.darkGray,
  },
  removeItemButton: {
    backgroundColor: colors.error,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  removeItemButtonText: {
    fontSize: 18,
  },
  itemValores: {
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  itemValoresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  itemQuantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
  },
  itemValorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkGray,
    marginRight: 8,
    flexShrink: 0,
  },
  itemQuantidadeInput: {
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    minWidth: 70,
    textAlign: "center",
  },
  itemPrecoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexShrink: 1,
  },
  itemPrecoValor: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    flexShrink: 1,
  },
  itemPrecoInput: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.white,
    minWidth: 80,
  },
  itemCustoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  itemCustoLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  itemCustoValor: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.darkGray,
  },
  // Aviso de margem baixa
  itemMargemBaixaWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 6,
  },
  itemMargemBaixaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  itemMargemBaixaTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
    flex: 1,
  },
  itemTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkGray,
  },
  itemTotalValor: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.primary,
  },
  // Estilos da seção de valores adicionais
  valoresAdicionaisSection: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  inputSmall: {
    flex: 1,
  },
  // Estilos da seção de totais
  totaisContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  totaisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  totaisLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  totaisValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkGray,
  },
  totalFinalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  totalFinalLabel: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.white,
  },
  totalFinalValor: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  // Estilos do modal de pesquisa de item
  itemResultCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemResultInfo: {
    flex: 1,
  },
  itemResultCodigo: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  itemResultNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 6,
  },
  itemResultDetalhes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemResultUnidade: {
    fontSize: 13,
    color: colors.darkGray,
  },
  itemResultPreco: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  searchIcon: {
    fontSize: 20,
  },
  // Estilos da seção de condição de pagamento
  condicaoSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  condicaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  condicaoLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  trocarCondicaoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trocarCondicaoText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  condicaoCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  condicaoNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  condicaoDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  parcelasResumo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  parcelaItem: {
    paddingVertical: 4,
  },
  parcelaTexto: {
    fontSize: 13,
    color: colors.darkGray,
  },
  automaticaBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4caf50",
  },
  automaticaText: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "600",
  },
  // Estilos do modal de condições
  condicaoItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  condicaoItemContent: {
    flex: 1,
  },
  condicaoItemNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  condicaoItemDetalhe: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  // Estilos do modal de parcelas
  modalContentSmall: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalScrollContent: {
    padding: 20,
  },
  condicaoSelecionadaInfo: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  condicaoSelecionadaNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  totalParcelar: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.darkGray,
  },
  calcularButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  calcularButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  parcelasCalculadas: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  parcelasTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
  },
  parcelaCalculadaItem: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  parcelaCalculadaNumero: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  parcelaCalculadaInfo: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 2,
  },
  parcelaCalculadaValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  confirmarButton: {
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmarButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilos do DatePicker iOS
  datePickerModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    position: "absolute",
    bottom: 0,
    paddingBottom: 20,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  iosDatePicker: {
    backgroundColor: colors.white,
    height: 200,
  },
});
