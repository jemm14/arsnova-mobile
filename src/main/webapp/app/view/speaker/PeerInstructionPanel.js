/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2015 The ARSnova Team
 *
 * ARSnova Mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Mobile is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Mobile.  If not, see <http://www.gnu.org/licenses/>.
 */
Ext.define('ARSnova.view.speaker.PeerInstructionPanel', {
	extend: 'Ext.Panel',

	config: {
		title: "Peer-Instruction",
		iconCls: 'icon-timer',
		fullscreen: true,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		}
	},

	initialize: function (arguments) {
		this.callParent(arguments);

		this.toolbar = Ext.create('Ext.Toolbar', {
			docked: 'top',
			title: this.getTitle(),
			ui: 'light',
			items: [{
				xtype: 'button',
				text: Messages.STATISTIC,
				ui: 'back',
				scope: this,
				handler: function () {
					ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.statisticTabPanel.setActiveItem(0);
					ARSnova.app.innerScrollPanel = false;
				}
			}]
		});

		this.countdownTimer = Ext.create('ARSnova.view.components.CountdownTimer', {
			sliderDefaultValue: 2,
			onTimerStart: this.onTimerStart,
			onTimerStop: this.onTimerStop,
			startStopScope: this
		});

		this.startRoundButton = Ext.create('Ext.Button', {
			text: 'Erste Runde starten',
			style: 'margin: 0 auto;',
			ui: 'confirm',
			width: 220,
			scope: this,
			handler: function() {
				this.startNewPiRound(this.countdownTimer.slider.getValue() * 60);
				this.startRoundButton.hide();
				this.endRoundButton.show();
			}
		});

		this.endRoundButton = Ext.create('Ext.Button', {
			text: 'Runde sofort beenden',
			style: 'margin: 0 auto;',
			ui: 'decline',
			hidden: true,
			width: 220,
			scope: this,
			handler: function() {
				Ext.Msg.confirm('Beenden der Abstimmungsrunde', 'Wenn die Runde beendet wird, sind keine Abstimmungen mehr möglich bis eine neue Runde gestartet wird oder die Frage manuell entsperrt wird. Möchten Sie fortfahren?', function(id) {
					if(id === 'yes') {
						this.countdownTimer.stop();
						this.startNewPiRound();
					}
				}, this);
			}
		});

		this.questionManagementContainer = Ext.create('Ext.form.FieldSet', {
			title: Messages.QUESTION_MANAGEMENT,
			cls: 'centerFormTitle',
			hidden: true
		});

		this.roundManagementContainer = Ext.create('Ext.form.FieldSet', {
			title: 'Abstimmungsverwaltung',
			cls: 'centerFormTitle',
			items: [
				this.countdownTimer,
				this.startRoundButton,
				this.endRoundButton
			]
		});

		this.add([
			this.toolbar, 
			{
				xtype: 'formpanel',
				scrollable: null,
				items: [
					this.roundManagementContainer, 
					this.questionManagementContainer
				]
			}
		]);

		this.on('activate', this.onActivate);
		this.onBefore('activate', this.beforeActivate);
	},

	onActivate: function () {
		ARSnova.app.innerScrollPanel = this;
	},

	beforeActivate: function () {
		this.statisticChart = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart;
		this.round = this.statisticChart.questionObj.piRound;

		this.prepareQuestionManagementContainer();
		this.prepareCountdownTimer();
	},

	onTimerStart: function() {
		this.questionManagementContainer.hide();
		// activate question
		// delete all answers
	},

	onTimerStop: function() {
	},

	changePiRound: function(questionId) {
		if(this.statisticChart.questionObj._id === questionId) {
			this.statisticChart.enablePiRoundElements();

			if(this.round === 1) {
				this.statisticChart.activateFirstSegmentButton();
			} else {
				this.statisticChart.activateSecondSegmentButton();
			}

			this.questionManagementContainer.show();
			this.startRoundButton.show();
			this.endRoundButton.hide();

			this.round++;
			this.statisticChart.questionObj.piRound++;
			this.prepareCountdownButtons();
		}
	},

	startNewPiRound: function(delay) {
		var question = Ext.create('ARSnova.model.Question', this.statisticChart.questionObj);

		if(!delay || delay < 0) {
			delay = 0;
		}

		question.startNewPiRound(delay, {
			success: function(response) {
				console.debug('Pi Round started.');
			}
		});
	},

	prepareCountdownTimer: function() {
		var obj = this.statisticChart.questionObj;

		if(obj.piRoundActive) {
			this.countdownTimer.start(obj.piRoundStartTime, obj.piRoundEndTime);
		} else {
			this.countdownTimer.stop();
		}

		this.prepareCountdownButtons();
	},

	prepareQuestionManagementContainer: function() {
		if(!this.editButtons) {
			this.editButtons = Ext.create('ARSnova.view.speaker.ShowcaseEditButtons', {
				speakerStatistics: true,
				questionObj: this.cleanupQuestionObj(this.statisticChart.questionObj)
			});

			this.questionManagementContainer.add(this.editButtons);
			this.questionManagementContainer.show();
		} else {
			this.updateEditButtons();
		}
	},

	prepareCountdownButtons: function() {
		if(!this.statisticChart.questionObj.piRoundActive) {
			if(this.round === 1) {
				this.startRoundButton.setText('Erste Runde starten');
				this.countdownTimer.slider.show();
				this.startRoundButton.show();
			} else if (this.round === 2) {
				this.startRoundButton.setText('Zweite Runde starten');
				this.countdownTimer.slider.show();
				this.startRoundButton.show();
			} else {
				this.countdownTimer.slider.hide();
				this.startRoundButton.hide();
			}
			this.endRoundButton.hide();
			this.questionManagementContainer.show();
			
		} else {
			this.endRoundButton.show();
			this.startRoundButton.hide();
			this.questionManagementContainer.hide();
		}
	},

	updateEditButtons: function() {
		this.editButtons.questionObj = this.statisticChart.questionObj;
		this.editButtons.updateData(this.statisticChart.questionObj);
	},

	cleanupQuestionObj: function(questionObj) {
		if(questionObj) {
			questionObj.possibleAnswers.forEach(function(answer) {
				delete answer.formattedText;
			});
		}

		return questionObj;
	}
});