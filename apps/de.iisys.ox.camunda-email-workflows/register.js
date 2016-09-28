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
    'gettext!de.iisys.ox.camunda-email-workflows/register',
    'de.iisys.ox.camunda-email-workflows/config'
], function (ext, dia, gt, config) {

    'use strict';

    console.log('PLUGIN de.iisys.ox.camunda-email-workflows up and running...');

    // init:
    var KEY_STARTING_WITH = config.CAMUNDA_KEY_STARTING_WITH,
        CAMUNDA_URL = config.CAMUNDA_URL,
        CAMUNDA_FRAG_DEFS = '/process-definition?latestVersion=true',
        CAMUNDA_FRAG_DEF_KEY = '/process-definition/key/',
        CAMUNDA_FRAG_FORM_VARS = '/form-variables',


        MAIL_CID_VAR = config.PROCESS_VAR_MAIL_CID_NAME,
        MAIL_CONTENT_VAR  = config.PROCESS_VAR_MAIL_CONTENT_NAME,

        CONTENT_TYPE_PLAIN = 'text/plain',
        CONTENT_TYPE_HTML = 'text/html',

        mailCid,
        mailContent,
        storedDescriptions = [];


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
            
            if(data.cid)
                mailCid = data.cid;
            else
                mailCid = data.folder_id + '.' + data.id;

            /*
            console.log(data);
            if(data.attachments && data.attachments.length>0) {               
                mailContent = helper.getEmailContent(data.attachments[0].content, data.attachments[0].content_type);
            } else if(baton.model && baton.model.attributes && baton.model.attributes.attachments && baton.model.attributes.attachments.length > 0) {
                console.log('via baton');
                mailContent = helper.getEmailContent(
                    baton.model.attributes.attachments[0].content,
                    baton.model.attributes.attachments[0].content_type
                );
            } else {
                mailContent = '';
            }
            */

            this.append( $('<a href="#" data-ref="io.ox/mail/actions/reminder">').addClass('io-ox-action-link').text(gt('Start Workflow'))
                .click(function(event) {

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
                    .append(
                        $('<div id="workflow-description">').addClass('form-group').css('margin','0').css('padding-left','20px'),
                        $('<div id="start-form-variables">').addClass('form-group').css('margin','0').css('padding-left','20px'),
                        $('<p id="ajax-animation">')
                            .css('margin-bottom','0').css('text-align','center')
                            .append($('<i>').addClass('fa').addClass('fa-refresh').addClass('fa-spin'))
                    )
                    .addButton('close', gt('Cancel'))
                    .addPrimaryButton('start', gt('Start Workflow'));

                    dialog.on('start', function() {
                        camundaMailWF.startWorkflow();
                    });

                    dialog.show();

                }) );
        }
    });

    // set mail content:
    ext.point('io.ox/mail/detail/attachments').extend({
        id: 'de.iisys.ox.camunda-wf-detail',
        draw: function(baton) {
            if(baton.model.attributes) {
                var data = baton.model.attributes;
            
                if(data.attachments && data.attachments.length>0) {               
                    mailContent = helper.getEmailContent(data.attachments[0].content, data.attachments[0].content_type);
                } else {
                    mailContent = '';
                }
            }
        }
    });

    var helper = {
        getEmailContent: function(content, contentType) {
            var mailContent = '';

            if(content && content !== null) {
                mailContent = content;

                if(contentType && contentType === CONTENT_TYPE_PLAIN) {
                    mailContent = '<div>'+mailContent+'</div>';

                } else if(contentType === CONTENT_TYPE_HTML) {
                    // remove head:
                    var substr = mailContent.indexOf('</head>');
                    if(substr!==-1) {
                        mailContent = mailContent.substring(substr + '</head>'.length);
                    }
                    // remove style:
                    substr = mailContent.indexOf('<style>');
                    var substr2 = mailContent.indexOf('</style>');
                    if(substr!==-1 && substr2!==-1) {
                        mailContent = mailContent.substring(0, substr) + mailContent.substring(substr2+'</style>'.length);
                    }
                }

                mailContent = $.trim($(mailContent).text());
            }

            return mailContent;
        }
    };

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
                error: function(jqXHR, textStatus, errorThrown) {
                    camundaMailWF.showError(jqXHR);
                    console.log('textStatus: '+textStatus);
                    console.log('errorThrown: '+errorThrown);
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

                        storedDescriptions[data[i].key] = data[i].description;
                    }
                }
                if(first !== 'none')
                    camundaMailWF.loadStartFormVariables(data[first].key, first);
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
            camundaMailWF.sendAsyncRequest('GET', url, camundaMailWF.showStartFormVariables, null, key);
        },
        showStartFormVariables: function(data, processKey) {  
            if(storedDescriptions[processKey]!==null) {
                $('#workflow-description').empty().append(
                    $('<label>').text(gt('Description')+':'),
                    $('<p>').text(storedDescriptions[processKey])
                );
            }

            var objectKeys =  Object.keys(data);
            var html = [];

            for(var i=0; i<objectKeys.length; i++) {

                var theInput = $('<input name="'+objectKeys[i]+'">');
                if(objectKeys[i]===MAIL_CID_VAR) {
                    theInput.val(mailCid);
                    theInput.attr('type', 'hidden');
                } else if(objectKeys[i]===MAIL_CONTENT_VAR) {
                    theInput = $('<textarea name="'+objectKeys[i]+'" rows="6">').css('resize','vertical').val(mailContent);
                }

                theInput.addClass('form-control').css('margin-bottom', '10px');

                if(objectKeys[i]!==MAIL_CID_VAR) {
                    var label = objectKeys[i];

                    if(data[label].value && data[label].value !== null)
                        label = data[label].value;
                    else {
                        switch(label) {
                            case 'mailContent':
                                label = gt('Content of the mail');
                                break;
                        }
                    }

                    html.push($('<label>').text(label+':'));
                }

                html.push(theInput);

                /*
                $('#start-form-variables')
                    .append($('<label>').text(objectKeys[i]+':'))
                    .append(theInput); */
            }

            $('#start-form-variables').empty().append( html );

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