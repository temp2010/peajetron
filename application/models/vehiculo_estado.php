<?php
Class Vehiculo_estado extends CI_Model
{
	function combo()
	{
		try
		{
			$query = $this->db->get('vehiculo_estado');
			foreach($query->result() as $row)
				$combo[] = array("value" => $row->id_vehiculo_estado, "text" => $row->vehiculo_estado);

			return json_encode(array("options" => $combo));
		}
		catch(Exception $e)
		{		
			log_message('error', $e->getMessage());
			return false;
		}
	}
}
?>
