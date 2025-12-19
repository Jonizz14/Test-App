import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  AdminPanelSettings as AdminIcon,

} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiService from "../../data/apiService";

const ManageAdmins = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load admins from API
        const allUsers = await apiService.getUsers();
        const allAdmins = allUsers.filter((user) => user.role === "admin");
        setAdmins(allAdmins);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (adminId) => {
    try {
      await apiService.deleteUser(adminId);
      // Remove from local state
      setAdmins(admins.filter((admin) => admin.id !== adminId));
      setSuccess("Admin muvaffaqiyatli o'chirildi!");
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    } catch (error) {
      console.error("Failed to delete admin:", error);
      setError("Adminni o'chirishda xatolik yuz berdi");
    }
  };

  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (admin) => {
    navigate(`/headadmin/edit-admin/${admin.id}`);
  };



  // Filter admins based on search term
  const filteredAdmins = admins.filter((admin) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = admin.name || "";
    const email = admin.email || "";

    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box
      sx={{
        py: 4,
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 6,
          pb: 4,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Typography
          sx={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#1e293b",
            mb: 2,
          }}
        >
          Administratorlarni boshqarish
        </Typography>
        <Typography
          sx={{
            fontSize: "1.125rem",
            color: "#64748b",
            fontWeight: 400,
          }}
        >
          Adminlar ma'lumotlarini boshqaring va yangi adminlar qo'shing
        </Typography>
      </Box>

      {/* Search and Add Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Admin nomi yoki emailini qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#64748b" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mr: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2563eb",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2563eb",
              },
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/headadmin/add-admin")}
          sx={{
            backgroundColor: "#dc2626",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            whiteSpace: "nowrap",
            "&:hover": {
              backgroundColor: "#b91c1c",
            },
          }}
        >
          Admin qo'shish
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {searchTerm && (
        <Typography sx={{ mb: 2, color: "#64748b", fontSize: "0.875rem" }}>
          {filteredAdmins.length} ta admin topildi
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f8fafc",
                "& th": {
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "16px",
                },
              }}
            >
              <TableCell>Ism</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tashkilot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ro'yxatdan o'tgan</TableCell>
              <TableCell>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow
                key={admin.id}
                sx={{
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                  },
                  "& td": {
                    borderBottom: "1px solid #f1f5f9",
                    padding: "16px",
                    fontSize: "0.875rem",
                    color: "#334155",
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <AdminIcon sx={{ color: "#dc2626", fontSize: "1.5rem" }} />
                    <Typography sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {admin.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      backgroundColor: "#fef2f2",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "#dc2626",
                    }}
                  >
                    {admin.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: "#64748b" }}>
                    {admin.organization || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label="Faol"
                    color="success"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: "#64748b" }}>
                    {admin.registration_date ? new Date(admin.registration_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(`/headadmin/admin-details/${admin.id}`)
                      }
                      startIcon={<InfoIcon />}
                      sx={{
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                        minWidth: "auto",
                        borderColor: "#dc2626",
                        color: "#dc2626",
                        "&:hover": {
                          backgroundColor: "#fef2f2",
                          borderColor: "#b91c1c",
                        },
                      }}
                    >
                      Batafsil
                    </Button>

                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(admin)}
                      sx={{
                        color: "#059669",
                        "&:hover": {
                          backgroundColor: "#ecfdf5",
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(admin)}
                      sx={{
                        color: "#dc2626",
                        "&:hover": {
                          backgroundColor: "#fef2f2",
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main" }}>
          Adminni o'chirishni tasdiqlang
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Haqiqatan ham ushbu adminni o'chirishni xohlaysizmi?
          </Typography>
          {adminToDelete && (
            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5", mb: 2 }}>
              <Typography variant="h6">{adminToDelete.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                ID: {adminToDelete.display_id || adminToDelete.username}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email: {adminToDelete.email}
              </Typography>
            </Paper>
          )}
          <Alert severity="warning">
            <strong>E'tibor:</strong> Bu amal qaytarib bo'lmaydi. Admin o'chiriladi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => handleDelete(adminToDelete.id)}
            color="error"
            variant="contained"
            sx={{ cursor: "pointer" }}
          >
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default ManageAdmins;