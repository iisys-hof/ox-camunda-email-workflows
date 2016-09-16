/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Institute of Information Systems, Hof, Germany.
 *
 * @author Christian Ochsenkühn <christian.ochsenkuehn@iisys.de>
 */

define('de.iisys.ox.camunda-email-workflows/register', [
    'io.ox/core/extensions', 
    'io.ox/core/tk/dialogs', 
    'gettext!de.iisys.ox.camunda-email-workflows/register'
], function (ext, dia, gt) {

    'use strict';

    console.log('PLUGIN de.iisys.ox.camunda-email-workflows up and running...');

    // config:
    var KEY_STARTING_WITH = 'ox-';
    var CAMUNDA_URL = 'http://127.0.0.1:8080/engine-rest';
    var CAMUNDA_FRAG_DEFS = '/process-definition?latestVersion=true';
    var CAMUNDA_FRAG_DEF_KEY = '/process-definition/key/';
    var CAMUNDA_FRAG_FORM_VARS = '/form-variables';


    var MAIL_CID_VAR = 'mailCid';
    var MAIL_CONTENT_VAR  ='mailContent';

    var mailCid; var mailContent;


    ext.point('io.ox/mail/links/inline').extend({
        id: 'de.iisys.ox.camunda-divider',
        draw: function() {
            this.addClass('divider');
        }
    });

    ext.point('io.ox/mail/links/inline').extend({
        id: 'lessonExample2',
        draw: function (baton) {
            var data = baton.data;
//            console.log(data);
            
            if(data.cid)
                mailCid = data.cid;
            else
                mailCid = data.folder_id + '.' + data.id;


            if(data.attachments && data.attachments.length>0) {
                mailContent = data.attachments[0].content;

                if(mailContent!==null && mailContent!==undefined) {
                    var substr = mailContent.indexOf('</head>');
                    if(substr!==-1) {
                        mailContent = mailContent.substring(substr + '</head>'.length);
                    } else {
                        // to prevent errors when using $.text():
                        mailContent = '<div>'+mailContent+'</div>';
                    }

                    mailContent = $.trim($(mailContent).text());
                }
            }
            

            this.append( $('<a href="#" data-ref="io.ox/mail/actions/reminder">').addClass('io-ox-action-link').text('Start Workflow')
                .click(function() {

                    var workflowSelect = $('<select id="workflow-select">').addClass('form-control')
                            .append( $('<option>').text('loading...') )
                            .change(camundaMailWF.loadSelectedStartFormVariables);

                    // get processes:
                    var url = CAMUNDA_URL+CAMUNDA_FRAG_DEFS;
                    camundaMailWF.sendAsyncRequest('GET', url, camundaMailWF.showProcesses, null, workflowSelect);

                    // create dialog:
                    var dialog = new dia.ModalDialog({
                        width:600,
                        easyOut: true
                    });


                    dialog.header($('<h4>').text(gt('Start Workflow')));
                    dialog.header($('<a>').addClass('io-ox-context-help').append($('<i>').addClass('fa').addClass('fa-question-circle')));

                    dialog.append($('<div>').addClass('form-group')
                        .append($('<label>').text('Workflow'))
                        .append(workflowSelect)
                    )
                    .append($('<div id="start-form-variables">').addClass('form-group').css('margin','0').css('padding-left','20px'))
                    .append($('<p id="ajax-animation">')
                        .css('margin-bottom','0').css('text-align','center')
                        .append($('<i>').addClass('fa').addClass('fa-refresh').addClass('fa-spin')))
                    .addButton('close', gt('Cancel'))
                    .addPrimaryButton('start', gt('Start Workflow'));

                    dialog.on('start', function() {
                        camundaMailWF.startWorkflow();
                    });

                    dialog.show();

                }) );
        }
    });

    var camundaMailWF = {

        sendAsyncRequest: function(method, url, callback, payload, callbackValue) {
            
        //        animationOnOff(true);
                
            $.ajax(url, {
                dataType: 'json',
                type : method,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                data : JSON.stringify(payload),
                success: function(data) {
                    camundaMailWF.animationOnOff(false);
                    if(callbackValue)
                        callback(data,callbackValue);
                    else
                        callback(data);
                },
                error: function(data) {
                    camundaMailWF.showError(data);
                    camundaMailWF.animationOnOff(false);
                }
            });

        },

        showProcesses: function(data, selectField) {
        //    console.log('data: '+JSON.stringify(data));

            selectField.empty();
            if(data.length>0) {
                var first = 'none';
                for (var i=0; i < data.length; i++) {
                    if(data[i].key.substring(0,KEY_STARTING_WITH.length) === KEY_STARTING_WITH) {
                        selectField.append( $('<option value="'+data[i].key+'">').text(data[i].name) );
                        if(first==='none')
                            first = i;
                    }
                }
                if(first !== 'none')
                    camundaMailWF.loadStartFormVariables(data[first].key);
                else
                    selectField.append($('<option value="none">').text(' - no OX related workflows found - '));
            } else {
                selectField.append($('<option value="none">').text(' - '));
            }
        },

        loadSelectedStartFormVariables: function() {
            var key = $('#workflow-select').val();
            camundaMailWF.loadStartFormVariables(key);
        },
        loadStartFormVariables: function(key) {
            var url = CAMUNDA_URL+CAMUNDA_FRAG_DEF_KEY+key+CAMUNDA_FRAG_FORM_VARS;
            camundaMailWF.sendAsyncRequest('GET', url, camundaMailWF.showStartFormVariables);
        },
        showStartFormVariables: function(data) {    
            var objectKeys =  Object.keys(data);

            $('#start-form-variables').empty();

            for(var i=0; i<objectKeys.length; i++) {

                var theInput = $('<input name="'+objectKeys[i]+'">');
                if(objectKeys[i]===MAIL_CID_VAR) {
                    theInput.val(mailCid);
                } else if(objectKeys[i]===MAIL_CONTENT_VAR) {
                    theInput = $('<textarea name="'+objectKeys[i]+'" rows="6">').css('resize','vertical').val(mailContent);
                }

                theInput.addClass('form-control').css('margin-bottom', '10px');

                $('#start-form-variables')
                    .append($('<label>').text(objectKeys[i]+':'))
                    .append(theInput);
            } 

        },

        startWorkflow: function() {
            var key = $('#workflow-select').val();
            var inputs = $('#start-form-variables').find(':input');

            var variables = {};
            for(var i=0; i<inputs.length; i++) {
                var name = inputs[i].name;

                variables[name] = {
                    'type' : 'String',
                    'value' : $(inputs[i]).val()
                };
            } 

            var url = CAMUNDA_URL+CAMUNDA_FRAG_DEF_KEY+key+'/start';
            var requestBody = {
                'variables' : variables
            };

            camundaMailWF.sendAsyncRequest('POST', url, camundaMailWF.showWorkflowSuccess, requestBody);
        },
        showWorkflowSuccess: function(data) {
            console.log('Success: '+JSON.stringify(data));
            require(['io.ox/core/notifications', 'gettext!de.iisys.ox.camunda-email-workflows/register'], function(notify, gt) {
                    notify.yell('success',gt('Successfully started workflow.'));
            });
        },


        showError: function(error) {
            require(['io.ox/core/notifications'], function(notify) {
                    notify.yell('error','Camunda Error '+error.status+': '+error.statusText);
            });
        },

       animationOnOff: function(on) {
            if(on===true)
                $('#ajax-animation').append( $('<i>').addClass('fa').addClass('fa-refresh').addClass('fa-spin') );
            else
                $('#ajax-animation').empty();
        }

    };

});