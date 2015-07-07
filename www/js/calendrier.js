function charger_calendrier() {
	$('#maj_log').append("Téléchargement de la mise à jour....<br/>");
	var url = "http://sorties.picardie-nature.org/?t=export_json";
	var key = "shu9eiLelohgh1aW"; // c'est pas un grand secret ;-)
	$.ajax({
		dataType: "json",
		url: url,
		data: {key: key},
		success: function(data,txtstatus,xhr) {
			$('#maj_log').append("Téléchargement terminé<br/>");
			$('#maj_log').append(data.sorties.length+" sorties<br/>");
			sauve_calendrier(data);
			construire_index_calendrier();

		},
		method: "post",
		error: function (xhr,txtstatus,err) {
			$('#maj_log').append("Une erreur c'est produite pendant le téléchargement<br/>"+txtstatus+"<br/>");
		}
	});
}

function sauve_calendrier(cal) {
	for (var i=0;i<cal.sorties.length; i++) {
		var nouvel_cle = "sortie-"+cal.sorties[i].id_sortie;
		localStorage.setItem(nouvel_cle, JSON.stringify(cal.sorties[i]));
	}
	for (var i=0;i<cal.types_sortie.length;i++) {
		var cle = "type-"+cal.types_sortie[i].id_sortie_type;
		localStorage.setItem(cle, cal.types_sortie[i].lib);
	}
	for (var i=0;i<cal.publics_sortie.length;i++) {
		var cle ="public-"+cal.publics_sortie[i].id_sortie_public;
		localStorage.setItem(cle, cal.publics_sortie[i].lib);
	}
	for (var i=0;i<cal.materiels_sortie.length;i++) {
		var cle ="materiel-"+cal.materiels_sortie[i].id_sortie_materiel;
		localStorage.setItem(cle, cal.materiels_sortie[i].lib);
	}
	for (var i=0;i<cal.reseaux_sortie.length;i++) {
		var cle ="reseau-"+cal.reseaux_sortie[i].id_sortie_reseau;
		localStorage.setItem(cle, cal.reseaux_sortie[i].lib);
	}
	for (var i=0;i<cal.poles_sortie.length;i++) {
		var cle ="pole-"+cal.poles_sortie[i].id_sortie_pole;
		localStorage.setItem(cle, cal.poles_sortie[i].lib);
	}
	$('#maj_log').append("Enregistrement terminé "+localStorage.length+ " éléments<br/>");
}

function construire_index_calendrier() {
	$('#maj_log').append('Indexation<br/>');
	var index_types = {};
	var index_dates = {};
	var index_reseaux = {};
	for (var i=0;i<localStorage.length;i++) {
		var k = localStorage.key(i);
		var v = localStorage[k];

		var re_sortie = /^sortie-/;
		if (k.match(re_sortie)) {
			var s = undefined;
			try {
				var s = JSON.parse(v);
			} catch (e) {
				$('#maj_log').append("pas reussi a parser "+v);
			}
			if (index_types[s.id_sortie_type] == undefined) {
				index_types[s.id_sortie_type] = [s.id_sortie];
			} else {
				index_types[s.id_sortie_type].push(s.id_sortie);
			}
			if (index_reseaux[s.id_sortie_reseau] == undefined) {
				index_reseaux[s.id_sortie_reseau] = [s.id_sortie];
			} else {
				index_reseaux[s.id_sortie_reseau].push(s.id_sortie);
			}
		}
	}
	localStorage['index_types'] = JSON.stringify(index_types);
	localStorage['index_reseaux'] = JSON.stringify(index_reseaux);
	$('#maj_log').append('Indexation terminée<br/>');
}

function init_calendrier() {
	$('#btn_mettre_a_jour').click(charger_calendrier);
	function aff_liste_cles(k_index, re, ul_id, classe_btn, attr_page_sortie) {
		var ul = $('#'+ul_id);
		var index = JSON.parse(localStorage[k_index]);
		ul.html("");
		var keys = [];
		for (var i=0;i<localStorage.length;i++) {
			var k = localStorage.key(i); 
			if (k.match(re)) { 
				var id = k.split('-')[1]; 
				var count; 
				try { 
					count = index[id].length; 
				} catch (e) { 
					count = 0;
				}
				if (count > 0) {
					keys.push({kid: k, lib: localStorage[k], count: count});
				}
			}
		}
		keys.sort(function (a,b) {
			if (a.lib > b.lib) return 1;
			if (a.lib < b.lib) return -1;
			return 0;
		});
		for (var i=0;i<keys.length;i++) {
			var id = keys[i].kid.split('-')[1]; 
			ul.append(
				"<li><a href='javascript:;' "+
				"class='"+classe_btn+"' "+
				"id_filtre='"+id+"'>"+
				keys[i].lib+
				"<span class='ui-li-count'>"+keys[i].count+"</span>"+
				"</a>"+
				"</li>"
			);
		}
		ul.listview('refresh');
		$('#liste_sorties').attr("id_reseau", -1);
		$('#liste_sorties').attr("type_sortie", -1);
		$('.'+classe_btn).click(function (e) {
			$('#liste_sorties').attr(attr_page_sortie, $(this).attr('id_filtre'));
			$.mobile.navigate("#liste_sorties");
		});
	}
	$('#types').on("pageshow", function(evt) {
		aff_liste_cles("index_types", /^type-/, 'liste_types', 'btn_liste_type_sortie', 'type_sortie');
	});
	$('#reseaux').on("pageshow", function(evt) {
		aff_liste_cles("index_reseaux", /^reseau-/, 'liste_reseaux', 'btn_liste_reseau', "id_reseau");
	});
	$('#liste_sorties').on("pageshow", function(evt) {
			//$('#ls_log').html("type_sortie="+$(this).attr('type_sortie')+"<br/>");
			var type_sortie = parseInt($(this).attr('type_sortie'));
			var id_reseau = parseInt($(this).attr('id_reseau'));
			if (type_sortie == -1) type_sortie = undefined;
			if (id_reseau == -1) id_reseau = undefined;
			var re_sortie = /^sortie-/;
			$('#lv_sorties').html("");
			for (var i=0;i<localStorage.length;i++) {	
				var k = localStorage.key(i);
				if (k.match(re_sortie)) {
					var id = k.split('-')[1];
					var sortie = JSON.parse(localStorage[k]);
					if (type_sortie != undefined) {
						// tester si les parseInt() sont necessaire
						if (sortie.id_sortie_type != type_sortie)
							continue;
					}
					if (id_reseau != undefined) {
						if (sortie.id_sortie_reseau != id_reseau)
							continue;
					}
					$('#lv_sorties').append(
						"<li><a href='javascript:;' "+
						"class='btn_liste_sortie' "+
						"id_sortie="+id+" >"+sortie.nom_sortie+"</a></li>"
					);
				}
			}
			$('#lv_sorties').listview('refresh');
			$('.btn_liste_sortie').click(function (e) {
				$('#sortie').attr('id_sortie', $(this).attr('id_sortie'));
				$.mobile.navigate("#sortie");
			});
		}
	);

	$('#sortie').on("pageshow", function (evt) {
			var id = $(this).attr('id_sortie');
			$('#s_log').html("id_sortie = "+id+"<br/>");
			var json = localStorage["sortie-"+id]
			$('#s_log').append(json+"<br/>");
			var sortie = JSON.parse(json);

			$('#s_titre').html(sortie.nom_sortie);
			$('#s_description').html(sortie.desc);
			$('#s_commune').html(sortie.commune);
			$('#s_departement').html(sortie.departement);
			
			$('#s_dates').html("");
			sortie.date_sortie.sort(function (a,b) {
				var da = new Date(a.date_sortie);
				var db = new Date(b.date_sortie);
				if (da < db) return -1;
				if (da > db) return 1;
				return 0;
			});
			var options_date = {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"};
			var now = Date.now();
			for (var i=0; i<sortie.date_sortie.length; i++) {
				var d = sortie.date_sortie[i];
				var obj_date = new Date(d.date_sortie);

				if (obj_date < now) continue;

				var html = "<p class='date_"+d.etat+"'>"+obj_date.toLocaleDateString('fr-fr',options_date);
				if (d.inscription_prealable) 
					html + "<span class='ins_prealable'>sur inscription</span>";
				html += "<br/>";
				html += "</p>";
				$('#s_dates').append(html);
			}
			$("#s_description_lieu").html(sortie.description_lieu);
			$('#s_log').append("terminé<br/>");

			var keys = Object.keys(sortie);
			for (var i=0; i<keys.length; i++) {
				$("#s_log").append("key : "+keys[i]+"<br>");
			}
			$('#s_log').append("pole "+sortie.pole+"<br>");
		}
	);
}
