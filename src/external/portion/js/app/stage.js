/*global define $ requestAnimationFrame*/

define(function (require) {
	
	var MovieClip,
		Utils = require('app/utils');
	
	require('tweenmax');
	
	
	MovieClip = function (el, commandTimeline, resourceManager, transform) {
		var i,
			transformMat;
		
    	this.el = el;
		this.m_transform = transform;
		//Timeline is a collection of frames
		//Frame is a collection of Command Objects
		this.m_ctimeline = commandTimeline;
		this.m_timeline = new TimelineMax({
			useFrames: true, 
			paused: true,
			onRepeat: this.clear.bind(this), 
			onUpdate: this.runCommands.bind(this), 
			onUpdateParams: [resourceManager]});
		this.m_currentFrameNo = this.m_timeline.time();
		this.m_frameCount = this.m_ctimeline.Frame.length;
		this.m_children = [];
		if(this.m_transform !== undefined) 
		{
			//Apply the transformation on the parent MC
			var transformData =  this.m_transform;
			var transformArray = transformData.split(",");
			transformMat = new Snap.Matrix(transformArray[0],transformArray[1],transformArray[2],transformArray[3],transformArray[4],transformArray[5]);
			this.el.transform(transformMat.toTransformString());
		}
		
		this.m_timeline.add(function () {}, this.m_frameCount + 1);
	}
	
	MovieClip.prototype.clear = function () {
		var items = this.el.selectAll('*'),
			i;
		
		for (i = 0; i < items.length; i += 1) {
			items[i].remove();
		}
	}
	
	MovieClip.prototype.runCommands = function (resourceManager) {
		var frame,
			commands,
			c,
			cmdData,
			type,
			command;
		
		frame = this.m_ctimeline.Frame[this.m_timeline.time() - 1];
		if (!frame) {
			return;
		}
		
		commands = frame.Command;	
		
		for (c = 0; c < commands.length; c += 1) {
			cmdData = commands[c];
			type = cmdData.cmdType;
			command = undefined;

			switch(type)
			{
				case "Place":
					command = new PlaceObjectCommand(cmdData.charid, cmdData.objectId, cmdData.placeAfter, cmdData.transformMatrix);
				break;

				case "Move":
					command = new MoveObjectCommand(cmdData.objectId, cmdData.transformMatrix);
				break;

				case "Remove":
					command = new RemoveObjectCommand(cmdData.objectId);
				break;
				
				case "UpdateZOrder":
					command = new UpdateObjectCommand(cmdData.objectId , cmdData.placeAfter);
				break;

				case "UpdateVisibility":
					command = new UpdateVisibilityCommand(cmdData.objectId , cmdData.visibility);
				break;
			}

			if(command !== undefined) {
				command.execute(this, resourceManager);
			}
		}
	}
	
	MovieClip.prototype.getTimeline = function () {
		return this.m_timeline;
	}
	
	//PlaceObjectCommand Class
	var PlaceObjectCommand = function(charID, objectID, placeAfter, transform) 
	{
		this.m_charID = charID;
		this.m_objectID = objectID;
		this.m_placeAfter = placeAfter;
		this.m_transform = transform;	
	}

	//Execute function for PlaceObjectCommand
	PlaceObjectCommand.prototype.execute = function(stage, resourceManager)
	{
		console.log('Place command execute');
		
		var shape = resourceManager.getShape(this.m_charID),
			parentMC = stage.el,
			movieclipTimeline,
			movieclip,
			children,
			i,
			childMC,
			index;
		
		if(shape !== null && shape !== undefined)
		{
			Utils.CreateShape(parentMC, resourceManager, this.m_charID, this.m_objectID, this.m_placeAfter, this.m_transform);
		}
		else
		{
			// Movie clip logic starts here
			movieclipTimeline = resourceManager.getMovieClip(this.m_charID);
						
			if(parentMC != undefined)
			{
				//Create a  MC
				childMC = parentMC.g();
				childMC.attr({class: 'movieclip', token: this.m_objectID});

				if(this.m_placeAfter != 0)
				{
					children = parentMC.selectAll('[token="' + this.m_placeAfter + '"]');
					for (i = 0; i < children.length; i += 1) {
						if (children[i].parent().id == parentMC.id) { //ensure child of current movie clip
							children[i].before(childMC);
							break;
						}
					}
				}
				else
				{
					parentMC.add(childMC);
				}


				//Create a corresponding TimelineAnimator
				if(movieclipTimeline)
				{					
					movieclip = new MovieClip(childMC, movieclipTimeline, resourceManager, this.m_transform);
					stage.m_children.push(movieclip);
					
					var tl = movieclip.getTimeline();
					tl.play();
				}
			}
		}
	}

	//MoveObjectCommand Class
	var MoveObjectCommand = function(objectID, transform) 
	{
		this.m_objectID = objectID;
		//this.m_placeAfter = placeAfter;
		this.m_transform = transform;	
	}

	//Execute function for PlaceObjectCommand
	MoveObjectCommand.prototype.execute = function(stage, resourceManager)
	{
		var parentMC,
			transform,
			transformArray,
			transformMat,
			children,
			i;
			
		console.log("Move command execute");
		parentMC = stage.el;
		transform =  this.m_transform;
		transformArray = transform.split(",");
		transformMat = new Snap.Matrix(transformArray[0],transformArray[1],transformArray[2],transformArray[3],transformArray[4],transformArray[5]);

		if(parentMC != undefined)
		{
			children = parentMC.selectAll('[token="' + this.m_objectID + '"]');
			
			for (i = 0; i < children.length; i += 1) {
				if (children[i].parent().id == parentMC.id) { //ensure child of current movie clip
					children[i].transform(transformMat.toTransformString());
				}
			}		
		}
		
	}

	//UpdateObjectCommand Class
	var UpdateObjectCommand = function(objectID, placeAfter) 
	{
		this.m_objectID = objectID;
		this.m_placeAfter = placeAfter;
	}

	//Execute function for UpdateObjectCommand
	UpdateObjectCommand.prototype.execute = function(timelineAnimator, resourceManager)
	{
		console.log("Update command execute");
		
		/*
		var parentMC = timelineAnimator.s;

		if(parentMC != undefined)
		{
			//Change the Z order of the targetMC
			var index;							
			for(var indexz=0; indexz<parentMC.children.length; indexz++)
			{
				if(parentMC.children[indexz].id == parseInt(this.m_objectID))
				{
					var child = parentMC.getChildAt(indexz);
					if(this.m_placeAfter != 0)
					{					
						for(var index=0; index<parentMC.children.length; index++)
						{
							if(parentMC.children[index].id == parseInt(this.m_placeAfter))
							{
								//child.addChildAt(childMC,index);
								parentMC.setChildIndex(child,index - 1)
								break;
							}				
						}
					}				
					break;
				}				
			}		
		}
		*/
	}

	//RemoveObjectCommand Class
	var RemoveObjectCommand = function(objectID) 
	{
		this.m_objectID = objectID;	
	}

	//Execute function for RemoveObjectCommand
	RemoveObjectCommand.prototype.execute = function(stage, resourceManager)
	{
		var parentMC = stage.el,
			child;
		
		if(parentMC != undefined)
		{
			children = parentMC.selectAll('[token="' + this.m_objectID + '"]');
			
			for (i = 0; i < children.length; i += 1) {
				if (children[i].parent() == parentMC) { //ensure child of current movie clip
					children[i].remove();
				}
			}
		}	
	}

	//UpdateVisbilityCommand Class
	var UpdateVisibilityCommand = function(objectID,visibility) 
	{
		this.m_objectID = objectID;	
		this.m_visibilty = visibility;
	}

	//Execute function for UpdateVisbilityCommand
	UpdateVisibilityCommand.prototype.execute = function(timelineAnimator, resourceManager)
	{
		console.log("UpdateVisbilityCommand execute");
		var parentMC = timelineAnimator.m_targetMC;
		if(parentMC != undefined)
		{
			//Remove the targetMC
			var index,visibleBool;							
			for(var index=0; index<parentMC.children.length; index++)
			{
				if(parentMC.children[index].id == parseInt(this.m_objectID))
				{
					if(this.m_visibilty == "true")
						visibleBool = true;
						else
						visibleBool = false;

					parentMC.getChildAt(index).visible = visibleBool;

				}				
			}		
		}	
	}
	
	return MovieClip;
	
});