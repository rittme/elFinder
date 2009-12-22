elFinder.prototype.view = function(fm, el) {
	var self = this;
	this.fm = fm;
	
	this.kinds = {
		'directory'                     : 'Folder',
		'symlink'                       : 'Alias',
		'unknown'                       : 'Unknown',
		'application/x-empty'           : 'Plain text',
		'application/postscript'        : 'Postscript document',
		'application/octet-stream'      : 'Application',
		'application/vnd.ms-office'     : 'Microsoft Office document',
		'application/vnd.ms-word'       : 'Microsoft Word document',  
	    'application/vnd.ms-excel'      : 'Microsoft Excel document',
		'application/vnd.ms-powerpoint' : 'Microsoft Powerpoint presentation',
		'application/pdf'               : 'Portable Document Format (PDF)',
		'application/vnd.oasis.opendocument.text' : 'Open Office document',
		'application/x-shockwave-flash' : 'Flash application',
		'application/xml'               : 'XML document', 
		'application/x-bittorrent'      : 'Bittorrent file',
		'application/x-tar'             : 'TAR archive', 
	    'application/x-gzip'            : 'GZIP archive', 
	    'application/x-bzip2'           : 'BZIP archive', 
	    'application/x-zip'             : 'ZIP archive',  
	    'application/zip'               : 'ZIP archive',  
	    'application/x-rar'             : 'RAR archive',
		'application/javascript'        : 'Javascript apllication',
		'text/plain'                    : 'Plain text',
	    'text/x-php'                    : 'PHP source',
		'text/html'                     : 'HTML document', 
		'text/javascript'               : 'Javascript source',
		'text/css'                      : 'CSS style sheet',  
	    'text/rtf'                      : 'Rich Text Format (RTF)',
		'text/rtfd'                     : 'RTF with attachments (RTFD)',
		'text/x-c'                      : 'C source', 
		'text/x-c++'                    : 'C++ source', 
		'text/x-shellscript'            : 'Unix shell script',
	    'text/x-python'                 : 'Python source',
		'text/x-java'                   : 'Java source',
		'text/x-ruby'                   : 'Ruby source',
		'text/x-perl'                   : 'Perl script',
	    'text/xml'                      : 'XML document', 
		'image/x-ms-bmp'                : 'BMP image',
	    'image/jpeg'                    : 'JPEG image',   
	    'image/gif'                     : 'GIF Image',    
	    'image/png'                     : 'PNG image',    
	    'image/tiff'                    : 'TIFF image',   
	    'image/vnd.adobe.photoshop'     : 'Adobe Photoshop image',
		'audio/mpeg'                    : 'MPEG audio',  
		'audio/midi'                    : 'MIDI audio',
		'audio/ogg'                     : 'Ogg Vorbis audio',
		'audio/mp4'                     : 'MP4 audio',
		'audio/wav'                     : 'WAV audio',
		'video/x-dv'                    : 'DV video',
		'video/mp4'                     : 'MP4 video',
		'video/mpeg'                    : 'MPEG video',  
		'video/x-msvideo'               : 'AVI video',
		'video/quicktime'               : 'Quicktime video',
		'video/x-ms-wmv'                : 'WM video',   
		'video/x-flv'                   : 'Flash video'
	}
	
	this.tlb = $('<ul />');
	this.plc = null;

	this.nav = $('<div />').addClass('el-finder-nav').resizable({handles : 'e', autoHide : true, minWidth : 200, maxWidth: '500'});
	this.cwd = $('<div />').addClass('el-finder-cwd');
	this.spn = $('<div />').addClass('el-finder-spinner');
	this.msg = $('<p />').addClass('el-finder-err rnd-5').append('<div />').append('<strong/>').click(function() { $(this).hide(); });
	this.nfo = $('<div />').addClass('stat');
	this.pth = $('<div />').addClass('path');
	this.sel = $('<div />').addClass('selected-files');
	this.stb = $('<div />').addClass('el-finder-statusbar')
		.append(this.pth)
		.append(this.nfo)
		.append(this.sel);
	this.wrz = $('<div />').addClass('el-finder-workzone')
		.append(this.nav)
		.append(this.cwd)
		.append(this.spn)
		.append(this.msg)
		.append('<div style="clear:both" />');
	this.win = $(el).empty().addClass('el-finder').addClass(fm.options.cssClass||'')
		.append($('<div />').addClass('el-finder-toolbar').append(this.tlb))
		.append(this.wrz)
		.append(this.stb);

	this.tree = $('<ul class="el-finder-tree"><li><div></div><a href="#" class="root selected rnd-3">root</a></li></ul>').appendTo(this.nav);


	this.plc = $('<ul class="el-finder-places"/>').append($('<li/>').append('<div/>').append('<strong>'+this.fm.i18n(this.fm.options.places)+'</strong>').append($('<ul/>').hide()))

	this.nav[this.fm.options.placesFirst ? 'prepend' : 'append'](this.plc);

	this.spinner = function(show) {
		if (show) {
			this.win.addClass('el-finder-disabled');
			this.spn.show();
		} else {
			this.win.removeClass('el-finder-disabled');
			this.spn.hide();
		}
	}

	this.fatal = function(t) {
		self.error(t.status != '404' ? 'Invalid backend configuration!' : 'Unable to connect to backend!')
	}
	
	this.error = function(err, data) {
		this.fm.lock();
		err = this.fm.i18n(err)+this.formatErrorData(data);
		this.msg.removeClass('el-finder-warn').show().children('strong').empty().html(err);
		setTimeout(function() { self.msg.fadeOut('slow'); }, 5000);
	}
	
	this.renderNav = function(tree) {
		var li = this.tree.children('li');
		li.children('div').removeClass('collapsed expanded').next('a').text(tree[0].name).attr('key', tree[0].hash).next('ul').remove();
		this.fm.dirs = {};
		this.fm.dirs[tree[0].hash] = tree[0];
		if (tree[0].dirs.length) {
			li.children('div').addClass('collapsed expanded').end().append(traverse(tree[0].dirs));
			li.find('ul>li ul').hide();
		}
		
		if (this.fm.options.places) {
			this.renderPlaces();
		}
		
		function traverse(tree) {
			var i, hash, c='', html = '<ul>';
			for (i=0; i < tree.length; i++) {
				if (!tree[i].read && !tree[i].write) {
					c = 'noaccess';
				} else if (!tree[i].read) {
					c = 'dropbox';
				} else if (!tree[i].write) {
					c = 'readonly';
				} 
				html += '<li><div '+(tree[i].dirs.length ? 'class="collapsed"' : '')+'></div><a href="#" class="'+c+' rnd-3" key="'+tree[i].hash+'">'+tree[i].name+'</a>';

				if (tree[i].dirs.length) {
					html += traverse(tree[i].dirs);
				}
				html += '</li>';
			}
			return html +'</ul>';
		}
	}
	
	this.renderPlaces = function() {
		var i, d, pl = this.fm.getPlaces(),	ul = this.plc.show().children('li').children('ul').empty().hide();
		ul.prev().prev().removeClass('collapsed expanded');

		if (pl.length) {
			for (i=0; i < pl.length; i++) {
				d = this.tree.find('[key="'+pl[i]+'"]').parent('li');
				if (d.length) {
					d.children('div').removeClass('collapsed expanded');
					ul.append(d.clone());
				} else {
					this.fm.removePlace(pl[i]);
				}
			};
			ul.children().length && this.plc.children('li:first').children('div').addClass('collapsed');
		}
	}
	
	this.renderCwd = function() {
		this.cwd.empty();

		var num  = 0, 
			size = 0, 
			cnt = this.fm.options.view == 'icons' 
				? this.cwd 
				: $('<table />').append(
					$('<tr/>')
						.append($('<th/>').text(this.fm.i18n('Name')).attr('colspan', 2))
						.append($('<th/>').text(this.fm.i18n('Permissions')))
						.append($('<th/>').text(this.fm.i18n('Modified')))
						.append($('<th/>').text(this.fm.i18n('Size')))
						.append($('<th/>').text(this.fm.i18n('Kind')))
					)
					.appendTo(this.cwd);
				

		for (var hash in this.fm.cdc) {
			num++;
			size += this.fm.cdc[hash].size;
			cnt.append(this.fm.options.view == 'icons' ? this.renderIcon(this.fm.cdc[hash]) : render(this.fm.cdc[hash]))
		}
		
		this.pth.text(fm.cwd.rel);
		this.nfo.text(fm.i18n('items')+': '+num+', '+this.formatSize(size));
		this.sel.empty();
		
		function render(f) {
			var p  = $('<p />'),  
				el = $('<tr/>').addClass(self.mime2class(f.mime)).attr('key', f.hash)

			el.append($('<td />').addClass('icon').append(p))
				.append($('<td />').text(f.name))
				.append($('<td />').text(self.formatPermissions(f.read, f.write, f.rm)))
				.append($('<td />').text(self.formatDate(f.date)))
				.append($('<td />').text(self.formatSize(f.size)))
				.append($('<td />').text(self.kind(f)));
			f.type == 'link' && p.append('<em/>');
			if (!f.read) {
				p.append('<em class="wo" />');
			} else if (!f.write) {
				p.append('<em class="ro" />');
			}
			return el;
		}
	}

	this.formatName = function(n) {
		var w = self.fm.options.wrap;
		if (w>0) {
			if (n.length > w*2) {
				return n.substr(0, w)+"&shy;"+n.substr(w, w-5)+"&hellip;"+n.substr(n.length-3);
			} else if (n.length > w) {
				return n.substr(0, w)+"&shy;"+n.substr(w);
			}
		}
		return n;
	}

	this.renderIcon = function(f) {
		var el = $('<div/>').addClass(this.mime2class(f.mime)).attr('key', f.hash),
			p  = $('<p/>');

		el.append(p).append($('<label/>').html(this.formatName(f.name)).attr('title', f.name));
		f.type == 'link' && el.append('<em />');
		if (!f.read && !f.write) {
			el.addClass('noaccess')
		} else if (!f.read) {
			el.append('<em class="dropbox" />');
		} else if (!f.write) {
			el.append('<em class="readonly" />');
		}
		f.tmb && this.tmb(p, f.tmb);
		return el;
	}

	this.updateElement = function(hash, f) {
		this.tree.find('a[key="'+hash+'"]').text(f.name).attr('key', f.hash);
		var el = this.cwd.find('[key="'+hash+'"]').attr('key', f.hash).addClass(this.mime2class(f.mime));
		if (this.fm.options.view == 'list') {
			el.children('td').next().text(f.name).next().text(self.formatPermissions(f.read, f.write, f.rm)).next().text(self.formatDate(f.date)).next().text(self.formatSize(f.size)).next().text(self.kind(f));
		} else {
			el.find('label').html(this.formatName(f.name)).attr('title', f.name);
		}
		this.plc.find('a[key="'+hash+'"]').text(f.name).attr('key', f.hash)
	}

	this.tmb = function(p, url) {
		p.append($('<span/>').addClass('rnd-5').css('background', ' url("'+url+'") 0 0 no-repeat'))
	}

	

	this.selectedInfo = function() {
		var i, s = 0, sel = this.fm.getSelected();
		this.sel.empty();
		if (sel.length) {
			for (i=0; i<sel.length; i++) {
				s += sel[i].size;
			}
			this.sel.text(this.fm.i18n('selected items')+': '+sel.length+', '+this.formatSize(s));
		}
	}

	this.formatErrorData = function(data) {
		var err = ''
		if (typeof(data) == 'object') {
			err = '<br />';
			for (var i in data) {
				err += i+' '+self.fm.i18n(data[i])+'<br />';
			}
		}
		return err;
	}

	this.mime2class = function(mime) {
		return mime.replace('/' , ' ').replace(/\./g, '-');
	}

	this.formatDate = function(d) {
		return d.replace(/([a-z]+)\s/i, function(a1, a2) { return self.fm.i18n(a2)+' '; });
	}

	this.formatSize = function(s) {
		var n = 1, u = 'b';
		if (s > 1073741824) {
			n = 1073741824;
			u = 'Gb';
		} else if (s > 1048576) {
            n = 1048576;
            u = 'Mb';
        } else if (s > 1024) {
            n = 1024;
            u = 'Kb';
        }
        return parseInt(s/n)+' '+u;
	}

	this.formatPermissions = function(r, w, rm) {
		var p = [];
		r  && p.push(self.fm.i18n('read'));
		w  && p.push(self.fm.i18n('write'));
		rm && p.push(self.fm.i18n('remove'));
		return p.join('/');
	}
	
	this.kind = function(f) {
		return this.fm.i18n(f.type=='link' ? 'symlink' : this.kinds[f.mime]||'unknown');
	}
	
}