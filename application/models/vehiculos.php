<?php
Class Vehiculos extends CI_Model
{
	function __construct()
	{
		parent::__construct();
	}

	function buscar($placa = null)
	{
		try
		{
			$query = $this->db->get_where('vehiculo', array('placa' => $placa));
			if($query->num_rows() > 0)
			{
				return $query->result();
			}
			else
			{
				return false;
			}
		}
		catch(Exception $e)
		{		
			log_message('error', $e->getMessage());
			return false;
		}
	}

	function insertar($datos)
	{
		try
		{
			$this->db->trans_begin();
			unset($datos['envia']);
			$datos['id_estado_vehiculo'] = 1;
			foreach($datos as $key => $value)
				if($datos[$key] == "")
					unset($datos[$key]);
			$this->db->insert('vehiculo', $datos);
			$this->db->trans_commit();

			return true;
		}
		catch(Exception $e)
		{
			$this->db->trans_rollback();
			return false;
		}
	}
}
?>
