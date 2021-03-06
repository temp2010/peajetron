<?php
Class Ubicaciones extends CI_Model
{
	function listar()
	{
		try
		{
			$query  = $this->db->get('ubicacion');
			$result = $query->result();

			return json_encode($result);
		}
		catch(Exception $e)
		{		
			log_message('error', $e->getMessage());
			return false;
		}
	}

	function combo()
	{
		try
		{
			$query = $this->db->get('ubicacion');
			foreach($query->result() as $row)
				$combo[] = array("value" => $row->id_ubicacion, "text" => $row->ubicacion);

			return json_encode(array("options" => $combo));
		}
		catch(Exception $e)
		{		
			log_message('error', $e->getMessage());
			return false;
		}
	}

	function buscar($ubicacion)
	{
		try
		{
			$query = $this->db->get_where('ubicacion', array('id_ubicacion_padre' => $ubicacion));
			if($query->num_rows() > 0)
			{
				return false;
			}
			else
			{
				return true;
			}
		}
		catch(Exception $e)
		{		
			log_message('error', $e->getMessage());
			return false;
		}
	}
}
?>
