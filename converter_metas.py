"""
Converte BASE.xlsx (metas/OKR-KPI) em metas.json.
Preenche Objetivo (O) quando vazio (forward-fill) e gera ids estáveis por indicador.
"""
import pandas as pd
import json
import re
import sys
from pathlib import Path


def slug_id(text, index):
    """Gera id estável: slug a partir do texto + índice como fallback."""
    if pd.isna(text) or str(text).strip() == "":
        return f"indicador-{index}"
    s = str(text).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s)[:40]
    return s or f"indicador-{index}"


def excel_para_metas_json(nome_arquivo_excel, nome_arquivo_json):
    try:
        df = pd.read_excel(nome_arquivo_excel)
        df.columns = df.columns.str.strip()
    except FileNotFoundError:
        print(f"Erro: O arquivo '{nome_arquivo_excel}' não foi encontrado.")
        return False
    except Exception as e:
        print(f"Erro ao ler a planilha: {e}")
        return False

    # Mapear nomes de colunas possíveis
    col_map = {
        "objetivo": None,
        "indicador": None,
        "tipo": None,
        "forma_coleta": None,
        "temporalidade": None,
        "meta_geral": None,
        "unidade": None,
        "quantidade_medicoes": None,
    }
    for c in df.columns:
        cn = c.lower().strip()
        if "objetivo" in cn and "o)" in cn:
            col_map["objetivo"] = c
        elif cn == "indicador":
            col_map["indicador"] = c
        elif "tipo" in cn and "indicador" in cn:
            col_map["tipo"] = c
        elif "forma" in cn and "coleta" in cn:
            col_map["forma_coleta"] = c
        elif cn == "temporalidade":
            col_map["temporalidade"] = c
        elif "meta" in cn and "geral" in cn:
            col_map["meta_geral"] = c
        elif cn == "unidade":
            col_map["unidade"] = c
        elif "quantidade" in cn and "medi" in cn:
            col_map["quantidade_medicoes"] = c

    for k, v in col_map.items():
        if v is None and k in ("objetivo", "indicador", "tipo", "meta_geral", "unidade"):
            print(f"Aviso: coluna esperada não encontrada: {k}")

    # Forward-fill Objetivo
    if col_map["objetivo"]:
        df[col_map["objetivo"]] = df[col_map["objetivo"]].ffill()

    objetivos_unicos = []
    if col_map["objetivo"]:
        for v in df[col_map["objetivo"]].dropna().unique():
            s = str(v).strip()
            if s and s not in objetivos_unicos:
                objetivos_unicos.append(s)

    indicadores = []
    for i, row in df.iterrows():
        obj = str(row.get(col_map["objetivo"] or "", "")).strip() if col_map["objetivo"] else ""
        ind = str(row.get(col_map["indicador"] or "", "")).strip() if col_map["indicador"] else ""
        if not ind:
            continue
        tipo = str(row.get(col_map["tipo"] or "", "")).strip() if col_map["tipo"] else "KPI"
        forma = str(row.get(col_map["forma_coleta"] or "", "")).strip() if col_map["forma_coleta"] else ""
        temp = str(row.get(col_map["temporalidade"] or "", "")).strip() if col_map["temporalidade"] else ""
        meta = row.get(col_map["meta_geral"])
        if pd.notna(meta):
            try:
                meta = float(meta)
            except (TypeError, ValueError):
                meta = None
        else:
            meta = None
        unidade = str(row.get(col_map["unidade"] or "", "")).strip() if col_map["unidade"] else ""
        qtd = row.get(col_map["quantidade_medicoes"])
        if pd.notna(qtd):
            try:
                qtd = int(qtd)
            except (TypeError, ValueError):
                qtd = None
        else:
            qtd = None

        idx = len(indicadores) + 1
        id_estavel = slug_id(ind, idx)
        # Garantir unicidade
        existing_ids = {x["id"] for x in indicadores}
        base_id = id_estavel
        suffix = 0
        while id_estavel in existing_ids:
            suffix += 1
            id_estavel = f"{base_id}-{suffix}"
            existing_ids.add(id_estavel)

        indicadores.append({
            "id": id_estavel,
            "objetivo": obj,
            "indicador": ind,
            "tipo": tipo,
            "forma_coleta": forma,
            "temporalidade": temp,
            "meta_geral": meta,
            "unidade": unidade,
            "quantidade_medicoes": qtd,
        })

    out = {
        "objetivos": objetivos_unicos,
        "indicadores": indicadores,
    }
    with open(nome_arquivo_json, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"metas.json gerado com sucesso: {len(objetivos_unicos)} objetivos, {len(indicadores)} indicadores.")
    return True


if __name__ == "__main__":
    base = Path(__file__).parent
    excel_path = base / "BASE.xlsx"
    json_path = base / "metas.json"
    if len(sys.argv) >= 2:
        excel_path = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        json_path = Path(sys.argv[2])
    excel_para_metas_json(str(excel_path), str(json_path))
