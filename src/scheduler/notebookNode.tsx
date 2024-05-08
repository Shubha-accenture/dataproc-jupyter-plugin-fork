import React, { useEffect, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
//import { LabIcon } from '@jupyterlab/ui-components';
//import gcsUploadIcon from '../../style/icons/gcs_upload_icon.svg';
//import {handleFileUpload} from '../utils/utils'

// const iconGCSUpload = new LabIcon({
//   name: 'gcs-toolbar:gcs-upload-icon',
//   svgstr: gcsUploadIcon
// });

function NotebookNode({ data, isConnectable }: NodeProps) {
  //const NotebookNode = ({ data, ...props }:{data: NodeProps, isConnectable : NodeProps}) => {
    // Access extra parameters via data
  //const { exampleParam, anotherParam} = data;
  //console.log(exampleParam, anotherParam)
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);

  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);

  const onInputFileNameChange = (evt: any) => {
    data.inputFile = evt.target.value;
    setInputFileSelected(evt.target.value);
    console.log(evt.target.value);
    console.log("calling upload")
    //handleFileUpload(evt);
  };
  // const handleFileUpload = async (event: any) => {
  //   const input = event.target as HTMLInputElement;
  //   const files = Array.from(input.files || []);

  //   // Clear the input element's value to force the 'change' event on subsequent selections
  //   // input.value = '';

  //   if (files && files.length > 0) {
  //     files.forEach((fileData: any) => {
  //       const file = fileData;
  //       const reader = new FileReader();
  //       console.log('file', file);
  //       // Read the file as text
  //       reader.onloadend = async () => {
  //         console.log('File result:', reader.result);

  //         //
  //         const contentsManager = app.serviceManager.contents;
  //         const { tracker } = factory;
  //         // Get the current active widget in the file browser
  //         const widget = tracker.currentWidget;
  //         if (!widget) {
  //           console.error('No active file browser widget found.');
  //           return;
  //         }

  //         // Define the path to the 'notebookTemplateDownload' folder within the local application directory
  //         const notebookTemplateDownloadFolderPath = widget.model.path.includes(
  //           'gs:'
  //         )
  //           ? ''
  //           : widget.model.path;

  //         // const urlParts = file.name
  //         const filePath = `${notebookTemplateDownloadFolderPath}${path.sep}${file.name}`;

  //         // Save the file to the workspace
  //         await contentsManager.save(filePath, {
  //           type: 'file',
  //           format: 'text',
  //           content: JSON.stringify(reader.result)
  //         });

  //         // Refresh the file fileBrowser to reflect the new file
  //         app.shell.currentWidget?.update();
  //       };
  //       reader.readAsText(file);
  //     });
  //   }
  // };

  const handleRetryCountChange = (e: number) => {
    data.retryCount = e;
    setRetryCount(e);
  };

  const handleRetryDelayChange = (e: number) => {
    data.retryDelay = e;
    setRetryDelay(e);
  };

  useEffect(() => {
    data.parameter = parameterDetail;
  }, [parameterDetail]);

  return (
    <>
      <div className="notebook-node">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />
        <div className="custom-node__header">Notebook Name:</div>
        <div className="custom-node__body">
          <label htmlFor="file-input">Input file*</label>
          <input
            className="nodrag"
            value={inputFileSelected}
            type="file"
            onChange={e => onInputFileNameChange(e)}
          />
          {/* <div
            role="button"
            className="icon-buttons-style"
            title="Upload"
            //onChange={handleFileUpload}
          >
            <iconGCSUpload.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div> */}
          <Input
            className="nodrag"
            value={retryCount}
            Label="Retry Count"
            onChange={e => handleRetryCountChange(Number(e.target.value))}
          />
          <Input
            className="nodrag"
            value={retryDelay}
            Label="Retry Delay"
            onChange={e => handleRetryDelayChange(Number(e.target.value))}
          />
          <LabelProperties
            labelDetail={parameterDetail}
            setLabelDetail={setParameterDetail}
            labelDetailUpdated={parameterDetailUpdated}
            setLabelDetailUpdated={setParameterDetailUpdated}
            buttonText="ADD PARAMETER"
            keyValidation={keyValidation}
            setKeyValidation={setKeyValidation}
            valueValidation={valueValidation}
            setValueValidation={setValueValidation}
            duplicateKeyError={duplicateKeyError}
            setDuplicateKeyError={setDuplicateKeyError}
            fromPage="react-flow"
          />
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          id="b"
          isConnectable={isConnectable}
        />
      </div>
    </>
  );
}

export default NotebookNode;
