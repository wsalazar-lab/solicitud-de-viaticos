import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Input } from "./components/ui/input";
import "./App.css"; // Importa el archivo CSS personalizado
import DeleteIcon from "@mui/icons-material/Delete";
import RepeatIcon from "@mui/icons-material/Repeat";
import RestoreIcon from "@mui/icons-material/Restore";
import emailjs from "emailjs-com";
import { v4 as uuidv4 } from 'uuid';


// Datos de ejemplo (en una aplicación real, estos vendrían de una API o base de datos)
const initialPersonnel = [
  { id: 1, name: "Juan Pérez", roles: ["Técnico", "Supervisor"] },
  { id: 2, name: "María García", roles: ["Ingeniero"] },
  { id: 3, name: "Carlos Rodríguez", roles: ["Asistente"] },
];



const initialRoles = ["Jefe de Grupo", "Montajista", "Ayudante", "Chofer"];

const initialExpenseTypes = ["Pensión", "Peaje", "Bencina", "Almuerzo"];




export default function ExpenseRequestApp() {

  
  
  const [personnel, setPersonnel] = useState(
    initialPersonnel.sort((a, b) => a.name.localeCompare(b.name)),
  );
  const [roles, setRoles] = useState(initialRoles);
  const [expenseTypes, setExpenseTypes] = useState(initialExpenseTypes);
  const [selectedPersonnel, setSelectedPersonnel] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(
    personnel.length > 0 ? personnel[0].id : null,
  );

  const [selectedZone, setSelectedZone] = useState("Zona 1");
  
  // Función para formatear los valores como moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  
  // Función para agregar una persona a la cuadrilla
  const addPersonToTeam = () => {
    const person = personnel.find((p) => p.id === selectedPersonId);
    if (person && !selectedPersonnel.find((p) => p.id === person.id)) {
      const roleIndex = selectedPersonnel.length % roles.length;
      const newPersonRoles = [roles[roleIndex]]; // Asignar un rol por defecto
      const newPerson = { ...person, selectedRoles: newPersonRoles };
      setSelectedPersonnel([...selectedPersonnel, newPerson]);
      setPersonnel(personnel.filter((p) => p.id !== selectedPersonId));
      setSelectedPersonId(personnel.length > 1 ? personnel[1].id : null);

      // Obtener valores de viáticos por defecto según la zona
      const defaultValues = getDefaultExpenseValues(newPersonRoles[0]);

      // Añadir viáticos para la nueva persona usando la estructura de viáticos existente
      const updatedExpenses =
        expenses.length > 0
          ? expenses.map((expense) => ({
              ...expense,
              [`person-${newPerson.id}`]: { value: defaultValues[expense.type] || 0 },
            }))
          : initialExpenseTypes.map((type) => ({
              id: uuidv4(), // Generar un ID único para cada nuevo gasto
              type,
              [`person-${newPerson.id}`]: { value: defaultValues[type] || 0 },
            }));

      setExpenses(updatedExpenses);
    }
  };



  const getDefaultExpenseValues = (role) => {
    if (selectedZone === "Zona 1") {
      return {
        Pensión: 0,
        Peaje: 0,
        Bencina: 0,
        Almuerzo: 0,
      };
    } else if (selectedZone === "Zona 2" || selectedZone === "Zona 3") {
      return {
        Pensión: 42000,
        Peaje: role === "Chofer" ? 5000 : 0,
        Bencina: 0,
        Almuerzo: 0,
      };
    }
  };

  // useEffect para actualizar los valores de viáticos según la zona seleccionada
  useEffect(() => {
    // Actualiza los valores de viáticos según la zona seleccionada y los roles
    const updatedExpenses = expenses.map((expense) => {
      const updatedExpense = { ...expense };

      selectedPersonnel.forEach((person) => {
        const role = person.selectedRoles[0]; // Suponiendo que solo hay un rol asignado por defecto
        const defaultValues = getDefaultExpenseValues(role);
        updatedExpense[`person-${person.id}`] = {
          value: defaultValues[expense.type] || 0,
        };
      });

      return updatedExpense;
    });

    setExpenses(updatedExpenses);
  }, [selectedZone, selectedPersonnel]);

  
  // Función para agregar un tipo de viático adicional
  const addExpenseType = () => {
    const lastExpenseType = expenseTypes[expenseTypes.length - 1];

    const newExpense = {
      id: uuidv4(), // Genera un ID único
      type: lastExpenseType,
    };
    selectedPersonnel.forEach((person) => {
      newExpense[`person-${person.id}`] = { value: 0 };
    });

    setExpenses([...expenses, newExpense]);
  };


  // Función para eliminar una persona de la cuadrilla
  const removePersonFromTeam = (personId) => {
    const person = selectedPersonnel.find((p) => p.id === personId);
    if (person) {
      setPersonnel(
        [...personnel, person].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedPersonnel(selectedPersonnel.filter((p) => p.id !== personId));
      // Eliminar gastos asociados con la persona eliminada
      const updatedExpenses = expenses.map((expense) => {
        const { [`person-${personId}`]: removed, ...rest } = expense;
        return rest;
      });
      setExpenses(updatedExpenses);
    }
  };

  // Función para cambiar el rol seleccionado de una persona
  const changePersonRoles = (personId, newRoles) => {
    setSelectedPersonnel(
      selectedPersonnel.map((p) =>
        p.id === personId ? { ...p, selectedRoles: newRoles } : p,
      ),
    );
  };

  // Función para eliminar un tipo de viático
  const removeExpenseType = (expenseId) => {
    setExpenses(expenses.filter((expense) => expense.id !== expenseId));
  };

  // Función para repetir el valor de la primera columna en todas las demás columnas de la fila
  const repeatFirstValue = (expenseId) => {
    setExpenses(
      expenses.map((expense) => {
        if (expense.id === expenseId) {
          const firstValue =
            Object.values(expense).find(
              (value) => typeof value === "object" && value.value !== 0,
            )?.value || 0;
          if (firstValue !== 0) {
            const updatedExpense = { ...expense };
            selectedPersonnel.forEach((person) => {
              updatedExpense[`person-${person.id}`] = { value: firstValue };
            });
            return updatedExpense;
          }
        }
        return expense;
      }),
    );
  };

  // Función para llevar todos los valores de la fila a cero
  const resetValuesToZero = (expenseId) => {
    setExpenses(
      expenses.map((expense) => {
        if (expense.id === expenseId) {
          const updatedExpense = { ...expense };
          selectedPersonnel.forEach((person) => {
            updatedExpense[`person-${person.id}`] = { value: 0 };
          });
          return updatedExpense;
        }
        return expense;
      }),
    );
  };

  // Función para actualizar el tipo de viático
  const updateExpenseType = (expenseId, newExpenseType) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === expenseId
          ? { ...expense, type: newExpenseType }
          : expense,
      ),
    );
  };

  // Función para actualizar el valor de un viático
  const updateExpenseValue = (expenseId, personId, value) => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === expenseId
          ? { ...expense, [`person-${personId}`]: { value } }
          : expense,
      ),
    );
  };

  // Función para descargar la estructura de gastos como JSON
  const downloadExpensesAsJson = () => {
    const expensesWithDetails = expenses.map((expense) => {
      const details = selectedPersonnel.reduce((acc, person) => {
        acc[person.name] = {
          role: person.selectedRole,
          value: expense[`person-${person.id}`]?.value || 0,
        };
        return acc;
      }, {});
      return {
        type: expense.type,
        details,
      };
    });
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(expensesWithDetails, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gastos_viaticos.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  //Función para crear tabla HTML con los datos de los viáticos
  const generateExpenseTableHTML = () => {
    let tableHTML =
      "<table border='1' style='border-collapse: collapse; width: 100%; text-align: left;'>";

    // Header Row
    tableHTML +=
      "<thead><tr style='background-color: #f2f2f2;'><th>Tipo de Viático</th>";
    selectedPersonnel.forEach((person) => {
      const roles = person.selectedRoles.join(", ");
      tableHTML += `<th style="padding: 8px; border: 1px solid #ddd;">${person.name} (${roles})</th>`;
    });
    tableHTML += "</tr></thead>";

    // Expense Rows
    tableHTML += "<tbody>";
    expenses.forEach((expense) => {
      tableHTML += `<tr><td style='padding: 8px; border: 1px solid #ddd;'>${expense.type}</td>`;
      selectedPersonnel.forEach((person) => {
        const value = expense[`person-${person.id}`]?.value || 0;
        tableHTML += `<td style='padding: 8px; border: 1px solid #ddd;'>${value}</td>`;
      });
      tableHTML += "</tr>";
    });
    tableHTML += "</tbody></table>";

    return tableHTML;
  };

  //Función para crear email
  const sendExpenseEmail = () => {
    const tableHTML = generateExpenseTableHTML();

    console.log("Generated HTML:", tableHTML);

    const emailParams = {
      to_email: "wladimirsalazar@armatec.cl",
      subject: "Solicitud de Viático",
      message_html: `
        <div>
        <h3>Solicitud de Viático</h3>
        ${tableHTML}
        </div>
      `,
    };

    emailjs
      .send(
        "service_g3k2sbf", // Cambia por tu Service ID de EmailJS
        "template_796qjsk", // Cambia por tu Template ID de EmailJS
        emailParams,
        "lxYyIzY8gGRgamT0I", // Cambia por tu User ID de EmailJS
      )
      .then(
        (result) => {
          console.log("Email sent successfully!", result.text);
          alert("Email enviado exitosamente!");
        },
        (error) => {
          console.error("Error sending email", error);
          alert(
            "Error al enviar el email. Revisa la consola para más detalles.",
          );
        },
      );
  };

  // Función para imprimir el estado actual de expenses
  const printExpensesState = () => {
    console.log("Estado actual de expenses:", expenses);
  };

  return (
    <div className="container compact-container">
      <h1 className="title">Solicitud de Viáticos</h1>

      <div className="card compact-card">
        <h2 className="card-title">Personal Disponible</h2>
        <div className="flex-container">
          <Autocomplete
            value={
              selectedPersonId !== null
                ? personnel.find((p) => p.id === selectedPersonId) || null
                : null // Asegúrate de que el valor no sea undefined
            }
            onChange={(event, newValue) => {
              setSelectedPersonId(newValue ? newValue.id : null);
            }}
            options={personnel}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Personal"
                variant="outlined"
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    addPersonToTeam();
                  }
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            style={{ width: "300px" }}
          />


          <Button
            className="button-primary compact-button"
            onClick={addPersonToTeam}
          >
            Agregar
          </Button>
        </div>
      </div>
      <div className="card compact-card">
        <h2 className="card-title">Seleccionar Zona</h2>
        <Select
          value={selectedZone}
          onValueChange={(value) => setSelectedZone(value)}
        >
          <SelectTrigger className="select-trigger compact-select">
            <SelectValue>{selectedZone}</SelectValue>
          </SelectTrigger>
          <SelectContent className="select-content compact-select-content">
            <SelectItem value="Zona 1" className="select-item compact-select-item">
              Zona 1
            </SelectItem>
            <SelectItem value="Zona 2" className="select-item compact-select-item">
              Zona 2
            </SelectItem>
            <SelectItem value="Zona 3" className="select-item compact-select-item">
              Zona 3
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card compact-card">
        <h2 className="card-title">Cuadrilla Seleccionada</h2>
        <Table className="table compact-table">
          <TableHeader>
            <TableRow>
              <TableHead className="table-head compact-table-head">
                Nombre
              </TableHead>
              <TableHead className="table-head compact-table-head">
                Roles
              </TableHead>

              <TableHead className="table-head compact-table-head">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPersonnel.map((person) => (
              <TableRow key={person.id} className="table-row compact-table-row">
                <TableCell
                  className="table-cell compact-table-cell"
                  style={{ padding: "4px" }}
                >
                  {person.name}
                </TableCell>
                <TableCell
                  className="table-cell compact-table-cell"
                  style={{ padding: "4px" }}
                >
                  <Autocomplete
                    multiple
                    options={roles}
                    value={person.selectedRoles || []} // Asegúrate de que nunca sea undefined
                    onChange={(event, newValue) => {
                      changePersonRoles(person.id, newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Seleccionar Roles"
                      />
                    )}
                    style={{ width: "300px" }}
                  />

                </TableCell>
                <TableCell
                  className="table-cell compact-table-cell"
                  style={{ padding: "4px" }}
                >
                  <Button
                    className="button-danger compact-button"
                    onClick={() => removePersonFromTeam(person.id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedPersonnel.length > 0 && (
        <div className="card compact-card">
          <h2 className="card-title">Gastos de Viáticos</h2>
          <Table className="table compact-table">
            <TableHeader>
              <TableRow>
                <TableHead className="table-head compact-table-head">
                  Tipo de Viático
                </TableHead>
                {selectedPersonnel.map((person) => (
                  <TableHead
                    key={person.id}
                    className="table-head compact-table-head"
                    style={{ padding: "4px" }}
                  >
                    {person.name} ({person.selectedRoles.join(", ")})
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
                  {expenses.map((expense) => (
                  <TableRow key={expense.id} className="table-row compact-table-row">

                  <TableCell
                    className="table-cell compact-table-cell"
                    style={{ padding: "4px" }}
                  >
                    <Select
                      value={expense.type}
                      onValueChange={(value) =>
                        updateExpenseType(expense.id, value)
                      }
                    >
                      <SelectTrigger className="select-trigger compact-select">
                        <SelectValue>{expense.type}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="select-content compact-select-content">
                        {initialExpenseTypes.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="select-item compact-select-item"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  {selectedPersonnel.map((person) => (
                    <TableCell
                      key={person.id}
                      className="table-cell compact-table-cell"
                      style={{ padding: "4px" }}
                    >
                      <Input
                        type="text"
                        value={formatCurrency(expense[`person-${person.id}`]?.value || 0)}
                        onChange={(e) => {
                          // Remueve cualquier símbolo no numérico para actualizar el valor
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          updateExpenseValue(expense.id, person.id, Number(rawValue));
                        }}
                        onFocus={(e) => {
                          // Al enfocar, remueve el formato para facilitar la edición
                          const rawValue = expense[`person-${person.id}`]?.value || 0;
                          e.target.value = rawValue;
                        }}
                        onBlur={(e) => {
                          // Al perder el enfoque, vuelve a formatear el valor
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          e.target.value = formatCurrency(Number(rawValue));
                        }}
                        className="input-field compact-input-field"
                      />

                    </TableCell>
                  ))}
                  <TableCell
                    className="table-cell compact-table-cell"
                    style={{ padding: "4px" }}
                  >
                    <Button
                      className="button-icon"
                      onClick={() => repeatFirstValue(expense.id)}
                    >
                      <RepeatIcon />
                    </Button>
                  </TableCell>

                  <TableCell
                    className="table-cell compact-table-cell"
                    style={{ padding: "4px" }}
                  >
                    <Button
                      className="button-icon"
                      onClick={() => resetValuesToZero(expense.id)}
                    >
                      <RestoreIcon />
                    </Button>
                  </TableCell>

                  <TableCell
                    className="table-cell compact-table-cell"
                    style={{ padding: "4px" }}
                  >
                    <Button
                      className="button-icon"
                      onClick={() => removeExpenseType(expense.id)}
                    >
                      <DeleteIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            className="button-primary compact-button"
            onClick={addExpenseType}
            style={{ marginTop: "16px" }}
          >
            Agregar Viático
          </Button>
          <Button
            className="button-secondary compact-button"
            onClick={downloadExpensesAsJson}
            style={{ marginTop: "8px", backgroundColor: "#4a90e2" }}
          >
            Descargar JSON
          </Button>

          <Button
            className="button-primary compact-button"
            onClick={sendExpenseEmail}
            style={{ marginTop: "16px", backgroundColor: "#4caf50" }}
          >
            Solicitar Viático
          </Button>

          <Button
            className="button-secondary compact-button"
            onClick={printExpensesState}
            style={{ marginTop: "16px" }}
          >
            Imprimir Estado de Gastos
          </Button>
        </div>
      )}
    </div>
  );
}
