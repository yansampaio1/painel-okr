import pandas as pd
import json

def excel_para_json_nps(nome_arquivo_excel, nome_arquivo_json):
    """
    Lê uma planilha do Excel com dados de NPS (Ciclo, Pergunta_Numero, Pergunta_Texto, NPS_Score),
    calcula o NPS geral, a média por ciclo e agrupa os dados por ciclo para salvar em um arquivo JSON.
    """
    try:
        df = pd.read_excel(nome_arquivo_excel)
        print("Planilha NPS lida com sucesso.")
        
        df.columns = df.columns.str.strip()
    except FileNotFoundError:
        print(f"Erro: O arquivo '{nome_arquivo_excel}' não foi encontrado.")
        return
    except Exception as e:
        print(f"Erro ao ler a planilha: {e}")
        return

    df['NPS_Score'] = pd.to_numeric(df['NPS_Score'], errors='coerce')
    df.dropna(subset=['NPS_Score'], inplace=True)
    
    nps_geral_score = df['NPS_Score'].mean() if not df['NPS_Score'].empty else 0

    dados = {
        'nps_geral': {
            'score': float(nps_geral_score),
            'analise': 'NPS geral calculado a partir da média de todas as perguntas.'
        },
        'ciclos': []
    }
    
    ciclos_agrupados = df.groupby('Ciclo')
    
    for ciclo, dados_ciclo in ciclos_agrupados:
        # Novo cálculo: média do NPS para o ciclo atual
        nps_score_ciclo = dados_ciclo['NPS_Score'].mean()
        
        novo_ciclo = {
            'ciclo_numero': int(ciclo),
            'nps_score_ciclo': float(nps_score_ciclo), # Adicionado a média do ciclo
            'perguntas': []
        }
        
        for _, linha in dados_ciclo.iterrows():
            nova_pergunta = {
                'numero': linha['Pergunta_Numero'],
                'texto': linha['Pergunta_Texto'],
                'nps_score': float(linha['NPS_Score'])
            }
            novo_ciclo['perguntas'].append(nova_pergunta)
        
        dados['ciclos'].append(novo_ciclo)

    with open(nome_arquivo_json, 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)
    
    print(f"Dados de NPS convertidos com sucesso e salvos em '{nome_arquivo_json}'.")

# Nome dos arquivos de entrada e saída
arquivo_excel_entrada = 'dados_nps.xlsx'
arquivo_json_saida = 'dados_nps.json'

excel_para_json_nps(arquivo_excel_entrada, arquivo_json_saida)