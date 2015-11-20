(function() {
   var socket = new io();

   var specialKeys = {
      13: 'enter',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
   };

   var command = $('#command');

   var replaced = false;
   command.textcomplete([
      { // html
         match: /\B@(\w*)$/,
         search: function (term, callback) {
            term = term.toLowerCase();
            Game.autocomplete(term, callback);
         },
         index: 1,
         replace: function (mention) {
            console.log(mention);
            replaced = true;
            return '@' + mention + ' ';
         }
      }
   ], { 
      appendTo: '#input',
      placement: 'top'
   });

   command.on('blur', function() {
      command.focus();
   });
   command.focus();

   command.on('input', function() {
      Input.set(command.val().toUpperCase());
   });

   $(document).on('keydown', function(e) {
      var keyCode = e.keyCode;

      if (specialKeys[keyCode]) {
         var key = specialKeys[keyCode];

         if (Input[key] && !$('.textcomplete-dropdown').is(':visible')) {
            if (replaced) {
               Input.set(command.val());
               replaced = false;
               return false;
            }

            Input[key]();

            return false;
         }
      }
   });


   var Input = {
      div: $('#input'),
      str: '',
      password: false,
      confirm: false,
      log: [],
      log_ndx: 0,
      set: function(str) {
         this.str = str;

         var str = this.str;
         if (this.password) {
            str = (new Array(str.length + 1)).join('*');
         }

         // this.div.html('$ ' + str + '<span class="blink">_</span>');
         command.val(this.str.toUpperCase());

         // if (this.str[this.str.length - 1] === '@') {

         // }


      },
      add: function(letter) {
         this.set(this.str + letter);
      },
      backspace: function() {
         if (this.str.length === 0) return;

         this.set(this.str.substring(0, this.str.length - 1));
      },
      up: function() {
         if (this.log_ndx > 0) {
            this.log_ndx --;

            this.set(this.log[this.log_ndx]);
         }
      },
      down: function() {
         if (this.log_ndx < this.log.length) {
            this.log_ndx ++;

            if (this.log_ndx < this.log.length) {
               this.set(this.log[this.log_ndx]);
            }
            else {
               this.set('');
            }
         }
      },
      logStr: function() {
         this.log.push(this.str);

         this.log_ndx = this.log.length;
      },
      enter: function() {
         if (!this.confirm && !this.password) {
            this.logStr();
         }

         this.reset();

         this.div.hide();

         // Update mentions
         var str = this.str.replace(/\B@(\w*)/g, function(str, tag) { return Game.toTag(tag); }).toLowerCase();

         if (str === 'logout' || str === 'quit') {
            Game.logout();
         }
         else if (this.confirm === false) {
            socket.emit('command', str);
         }
         else if (this.confirm === true) {
            this.confirm = this.str.toLowerCase();
            this.insertAttachment(new A.Small('Please enter it again to confirm.'));
         }
         else {
            // Check string
            if (this.confirm === str) {
               socket.emit('command', str);
               this.setPassword(false);
               this.confirm = false;
            }
            else {
               this.insertAttachment(new A.Error('Entries did not match. Please try again'));

               this.confirm = true;
               this.setPassword(true);
            }
         }

         Input.div.show();

         window.scrollTo(0,document.body.scrollHeight);

         this.set('');
      },
      reset: function() {
         var history = this.div.clone();

         var str = this.str;
         if (this.password) {
            str = (new Array(str.length + 1)).join('*');
         }

         history.html('$ ' + str);

         history.removeAttr('id');
         history.insertBefore(this.div);

         // Set password to false if we're not confirming a password
         this.setPassword(this.confirm && this.password);
      },
      setPassword: function(isPassword) {
         this.password = !!isPassword;

         command.attr('type', this.password ? 'password' : 'text');
      },
      setConfirm: function(confirm) {
         this.confirm = !!confirm;
      },
      insertAttachment: function(attachment) {
         var element = $('<div class="attachment ' + (attachment.color || 'info') + '">');

         if (!Array.isArray(attachment.text)) {
            attachment.text = [attachment.text];
         }
         attachment.text = attachment.text
            .join('<br />')
            .replace(/\n/g, '<br />')
            .replace(/<#([0-9]+)>/g, function(tag, id) {
               return '<span class="user-tag user-' + id + '">' + Game.lookup(tag) + '</span>'
            })
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\|\[(.*?)\](.*?)\|/g, function(string, cmd, text) {
               if (!text) {
                  return '<span class="copypasta execute">' + cmd + '</span>';
               }
               return '<span class="copypasta execute" pasta="' + cmd + '">' + text + '</span>'
            })
            .replace(/\|(.*?)\|/g, '<span class="copypasta">$1</span>');
         element.html(attachment.text);

         element.insertBefore(this.div);

         element.find('.copypasta').on('click', function() {
            var pasta = $(this).text().toUpperCase();
            var prefix = $(this).attr('pasta');
            if (prefix) {
               pasta = prefix + ' ' + pasta;
            }

            if ($(this).hasClass('execute')) {
               Input.set(pasta);
               Input.enter();
            }
            else {
               if (Input.str.length && Input.str[Input.str.length - 1] !== ' ') {
                  pasta = ' ' + pasta;
               }

               Input.add(pasta);
            }
         });
         
         window.scrollTo(0,document.body.scrollHeight);
      },
      insertAttachments: function(attachments) {
         while (attachments.length) {
            Input.insertAttachment(attachments.shift());
         }
      }
   };

   socket.on('attachment', function(attachment) {
      Input.insertAttachment(attachment);
   });

   socket.on('attachments', function(attachments) {
      Input.insertAttachments(attachments);
   });

   socket.on('password', function() {
      Input.setPassword(true);
   });

   socket.on('confirm', function() {
      Input.setConfirm(true);
   });

   window.Game.init(socket);
})(window);