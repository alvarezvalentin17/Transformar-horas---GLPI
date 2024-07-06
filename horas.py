
import pandas as pd
import unicodedata

# Función para eliminar tildes de un texto
def eliminar_tildes(texto):
    if isinstance(texto, str):
        return ''.join(
            (c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
        )
    return texto

# Leer el archivo CSV con una codificación adecuada y detectar errores
try:
    with open('glpi.csv', encoding='utf-8') as file:
        df = pd.read_csv(file, sep=';', usecols=['Título', 'Entidad', 'Duración total','Estado','Solicitante - Solicitante','Asignada a - Técnico','Fecha de apertura','Fecha de cierre'])
    print("Archivo CSV leído correctamente.")
except Exception as e:
    print("Error al leer el archivo CSV:", e)
    exit()

# Aplicar la función para eliminar tildes a todas las columnas de tipo object
try:
    df = df.applymap(eliminar_tildes)
except Exception as e:
    print("Error al eliminar tildes:", e)
    exit()

# Función para convertir la duración a horas
def duracion_a_horas(duracion):
    partes = duracion.split()
    horas = 0.0
    for i in range(0, len(partes), 2):
        cantidad = int(partes[i])
        unidad = partes[i + 1]
        if unidad in ['hora', 'horas', 'hours', 'hour']:
            horas += cantidad
        elif unidad in ['minuto', 'minutos', 'minutes', 'minute']:
            horas += cantidad / 60.0
        elif unidad in ['día', 'días', 'days', 'day']:
            horas += cantidad * 24.0
        elif unidad in ['segundo', 'segundos', 'seconds', 'second']:
            horas += cantidad / 3600.0
    return horas

# Aplicar la función a la columna 'Duración total'
try:
    df['Duración total (horas)'] = df['Duración total'].apply(duracion_a_horas)
    # Imprimir valores intermedios para debuggeo
    print(df[['Duración total', 'Duración total (horas)']])
    # Convertir valores a enteros si son enteros y usar comas en lugar de puntos
    df['Duración total (horas)'] = df['Duración total (horas)'].apply(lambda x: '{:.0f}'.format(x).replace('.', ',') if x.is_integer() else '{:.2f}'.format(x).replace('.', ','))
    print("Columna 'Duración total' traducida a horas.")
except Exception as e:
    print("Error al aplicar la función a la columna 'Duración total':", e)
    exit()

# Guardar las columnas seleccionadas en un nuevo archivo CSV con codificación utf-8-sig para manejar correctamente los caracteres especiales
try:
    df.to_csv('tu_archivo_modificado.csv', index=False, encoding='utf-8-sig')
    print("Archivo CSV modificado generado exitosamente.")
except Exception as e:
    print("Error al guardar el archivo CSV modificado:", e)
