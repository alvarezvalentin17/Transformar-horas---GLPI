import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import "./style.css";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setProcessedData(null); // Limpiar datos procesados al cambiar el archivo
    setProcessing(true); // Habilitar el estado de procesamiento
    processFile(selectedFile);
  };

  const eliminarTildes = (texto) => {
    if (typeof texto !== "string") {
      return texto;
    }
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const duracionAHoras = (duracion) => {
    if (!duracion) return 0;

    const partes = duracion.split(" ");
    let horas = 0.0;

    for (let i = 0; i < partes.length; i += 2) {
      const cantidad = parseInt(partes[i], 10);
      const unidad = partes[i + 1];

      if (["dias", "days", "day"].includes(unidad)) {
        horas += cantidad * 24.0; // Convertir días a horas
      } else if (["hora", "horas", "hours", "hour"].includes(unidad)) {
        horas += cantidad; // Sumar horas
      } else if (["minuto", "minutos", "minutes", "minute"].includes(unidad)) {
        horas += cantidad / 60.0; // Convertir minutos a horas
      } else if (
        ["segundo", "segundos", "seconds", "second"].includes(unidad)
      ) {
        horas += cantidad / 3600.0; // Convertir segundos a horas
      }
    }

    return parseFloat(horas.toFixed(2));
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      Papa.parse(text, {
        header: true,
        delimiter: ";",
        encoding: "UTF-8", // Asegura que la codificación sea UTF-8
        complete: (results) => {
          const columnsToProcess = [
            "Título",
            "Entidad",
            "Duración total",
            "Estado",
            "Solicitante - Solicitante",
            "Asignada a - Técnico",
            "Fecha de apertura",
            "Fecha de cierre",
          ];
          const data = results.data.map((row) => {
            const processedRow = {};
            columnsToProcess.forEach((col) => {
              processedRow[col] = eliminarTildes(row[col]);
            });
            if (processedRow["Duración total"]) {
              processedRow["Duración total (horas)"] = duracionAHoras(
                processedRow["Duración total"]
              );
            } else {
              processedRow["Duración total (horas)"] = 0; // Si no hay duración, asignar 0
            }
            return processedRow;
          });

          setProcessedData(data);
          setProcessing(false); // Deshabilitar el estado de procesamiento después de completar
        },
      });
    };
    reader.readAsText(file); // No es necesario especificar la codificación, debería usar UTF-8 por defecto
  };

  const downloadXLSX = () => {
    if (processedData && processedData.length > 0) {
      // Calcular suma total de Duración total (horas)
      const totalHoras = processedData.reduce((total, row) => {
        return total + parseFloat(row["Duración total (horas)"]);
      }, 0);

      // Crear el libro de trabajo y la hoja
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet, "Sheet1");

      // Agregar la fila con la suma total al final del archivo si hay datos
      if (processedData.length > 0) {
        const totalRow = {
          Título: "Total horas",
          "Duración total (horas)": totalHoras,
        };
        XLSX.utils.sheet_add_json(worksheet, [totalRow], {
          skipHeader: true,
          origin: processedData.length,
        });
      }

      // Descargar el archivo
      XLSX.writeFile(wb, "Reporte GLPI.xlsx");
    }
  };

  return (
    <div className="file-upload-container">
        <h1>Subir archivo CSV de GLPI</h1>            
      <div class="button-wrapper">
        <span class="label">Subir archivo...</span>
        <input
          type="file"
          name="upload"
          id="upload"
          class="upload-box"
          placeholder="Subir CSV"
          accept=".csv" 
          onChange={onFileChange}
        />
      </div>
      {processing ? (
        <button className="processing-btn" disabled>
          Procesando Archivo...
        </button>
      ) : processedData && processedData.length > 0 ? (
        <button className="download-btn" onClick={downloadXLSX}>
          Descargar Archivo Modificado (XLSX)
        </button>
      ) : (
        <h4 className="select-btn" aria-readonly>
          Esperando archivo CSV...
        </h4>
      )}
    </div>
  );
};

export default FileUpload;
