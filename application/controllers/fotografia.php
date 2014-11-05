<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
session_start();
class Fotografia extends CI_Controller {

	/**
	 * Index Page for this controller.
	 *
	 * Maps to the following URL
	 * 		http://example.com/index.php/welcome
	 *	- or -  
	 * 		http://example.com/index.php/welcome/index
	 *	- or -
	 * Since this controller is set as the default controller in 
	 * config/routes.php, it's displayed at http://example.com/
	 *
	 * So any other public methods not prefixed with an underscore will
	 * map to /index.php/welcome/<method_name>
	 * @see http://codeigniter.com/user_guide/general/urls.html
	 */
	 
	function __construct()
        {
                parent::__construct();
                if($this->session->userdata('peajetron'))
                {
                        $this->load->model('menu', '', TRUE);
                        $this->load->model('peajes', '', TRUE);
                        $this->load->model('cobros', '', TRUE);
                }
                else
                {
                        redirect('login', 'refresh');
                }
        }
    


	public function tomarFoto()
	{
		        $session = $this->session->userdata('peajetron');
		        $menu['menu'] = $this->menu->ensamblar($session['id_perfil']);
		        $data['titulo'] = 'Usuario: '.$session['nombre'];
		        $data['peajes'] = json_decode($this->peajes->listar(), true);
		        $this->load->view('front/head.php', $data);
		        $this->load->view('front/header.php');
		        $this->load->view('menu', $menu);
				$this->load->view('fotografia/foto',$data);
				$this->load->view('front/footer.php');
	}

	public function registrarPaso()
	{
		$session = $this->session->userdata('peajetron');
		$idUsuario = $session['id_usuario'];
		$placa = $_REQUEST['text'];
		$peaje = $_REQUEST['cabine'];
		$datos['placa'] = $placa;
		$datos['id_peaje'] = $peaje;
		$datos['id_usuario'] = $idUsuario;
		$result =  $this->cobros->insertarPlaca($datos);
		if($result)
		{
			echo "bien";
		}else
		{
			echo "mal";
		}
	}
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */