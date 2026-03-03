import pandas as pd
import json

def excel_para_json_mapeamento(nome_arquivo_excel, nome_arquivo_json):
    """
    Lê uma planilha do Excel, agrupa os dados por tema e ciclo,
    e salva o resultado em um arquivo JSON.
    """
    try:
        df = pd.read_excel(nome_arquivo_excel)
        print("Planilha Mapeamento lida com sucesso.")
        
        # Limpa os nomes das colunas para evitar erros de espaço
        df.columns = df.columns.str.strip()
    except FileNotFoundError:
        print(f"Erro: O arquivo '{nome_arquivo_excel}' não foi encontrado.")
        return
    except Exception as e:
        print(f"Erro ao ler a planilha: {e}")
        return

    # Converte os números das colunas
    df['porcentagem_ms1'] = pd.to_numeric(df['porcentagem_ms1'], errors='coerce')
    df['porcentagem_ms2'] = pd.to_numeric(df['porcentagem_ms2'], errors='coerce')

    # Calcula a evolução individual de cada pergunta
    df['evolucao'] = df['porcentagem_ms2'] - df['porcentagem_ms1']

    # Agrupa por tema e ciclo para montar a estrutura
    dados = {'temas': []}
    temas_agrupados = df.groupby('Tema')

    # Calcula a evolução média geral
    media_evolucao_geral = df['evolucao'].mean() if not df['evolucao'].empty else 0
    media_evolucao_geral_porcentagem = media_evolucao_geral * 100

    dados['status_geral'] = {
        'evolucao_media': float(media_evolucao_geral_porcentagem),
        'analise': f'A evolução média do conhecimento dos cursistas, considerando todas as perguntas e ciclos do curso, foi de {media_evolucao_geral_porcentagem:.2f}%.'
    }

    for tema, dados_tema in temas_agrupados:
        novo_tema = {
            'nome': tema,
            'dados': []
        }
        
        ciclos_agrupados = dados_tema.groupby('Ciclo')
        for ciclo, dados_ciclo in ciclos_agrupados:
            novo_ciclo = {
                'ciclo': int(ciclo),
                'respondentes': int(dados_ciclo['Respondentes'].iloc[0]) if not dados_ciclo.empty else 0,
                'perguntas': []
            }
            
            for _, linha in dados_ciclo.iterrows():
                nova_pergunta = {
                    'numero': linha['Pergunta'],
                    'titulo': linha['titulo'],
                    'pergunta_completa': linha['pergunta_completa'],
                    'porcentagem_ms1': float(linha['porcentagem_ms1']),
                    'porcentagem_ms2': float(linha['porcentagem_ms2']),
                    'analise': linha['Análise'],
                }
                novo_ciclo['perguntas'].append(nova_pergunta)

            novo_tema['dados'].append(novo_ciclo)
        
        dados['temas'].append(novo_tema)

    # Salva o dicionário final em um arquivo JSON
    with open(nome_arquivo_json, 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)
    
    print(f"Dados de mapeamento convertidos com sucesso e salvos em '{nome_arquivo_json}'.")

# Nome dos arquivos de entrada e saída
arquivo_excel_entrada = 'dados_mapeamento.xlsx'
arquivo_json_saida = 'dados.json'

excel_para_json_mapeamento(arquivo_excel_entrada, arquivo_json_saida)