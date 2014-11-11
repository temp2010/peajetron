function DespachadorRegistro()
{
  this.confs = new Configuration("../fotografia/registrarPaso", "POST");
}

DespachadorRegistro.prototype.setConfigurations = function(url,method)
{
  this.confs = new Configuration(url,method);
}

DespachadorRegistro.prototype.sendRequest = function(processedText)
{
  var dt = new Date();
  var month = dt.getMonth() + 1; 
  var time = dt.getDate() + "-" + month + "-" + dt.getFullYear() + " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
  var cabine = $('#identificador_cabina').val();
  var sha1Text = processedText + "" + time + "" + cabine;

//   alert(sha1Text);
  GLOBAL_STATUS = "OK";
//   var hash = CryptoJS.SHA1("Message");
//processedText = "RSQ912";
processedText = processedText.replace("lll", "111"); 
if(processedText){

  if(this.confs.method == "POST")
  {
    //DO POST
    $.post(this.confs.url, { text: processedText, time: time, cabine:cabine},function( data ) {
//       alert(data.status+": "+data.message);
        alert("paso registrado");

      GLOBAL_STATUS = data;
    },"json");
  }
  if(this.confs.method == "GET")
  {
    //DO GET
    $.get(this.confs.url,{ text: processedText, time: time, cabine:cabine},function( data ) {
      GLOBAL_STATUS = data;
    },"json");
  }
  alert("Registro satisfactorio");
}else{alert("ERROR placa no reconocida o no valida");}

  return GLOBAL_STATUS;
}
