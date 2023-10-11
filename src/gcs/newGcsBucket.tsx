import React, { useState, useEffect, useRef } from 'react';
import { ClipLoader } from 'react-spinners';
import { LabIcon } from '@jupyterlab/ui-components';
import { JupyterLab } from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IThemeManager } from '@jupyterlab/apputils';
import { IconButton, InputAdornment, TextField } from '@mui/material';
// import { folderIcon, fileIcon } from '@jupyterlab/ui-components';
import { toast } from 'react-toastify';

import {
  authApi,
  lastModifiedFormat,
  toastifyCustomStyle
} from '../utils/utils';
import {
  API_HEADER_BEARER,
  API_HEADER_CONTENT_TYPE,
  // GCS_UPLOAD_URL,
  GCS_URL
} from '../utils/const';
import { DataprocWidget } from '../controls/DataprocWidget';
import darkGcsFolderIcon from '../../style/icons/gcs_folder_icon_dark.svg';
import gcsFolderIcon from '../../style/icons/gcs_folder_icon.svg';
import searchIcon from '../../style/icons/search_icon.svg';
import searchClearIcon from '../../style/icons/search_clear_icon.svg';
import darkSearchIcon from '../../style/icons/search_icon_dark.svg';
import darkSearchClearIcon from '../../style/icons/dark_search_clear_icon.svg';
import gcsUploadIcon from '../../style/icons/gcs_upload_icon.svg';
import gcsRefreshIcon from '../../style/icons/gcs_refresh_icon.svg';
import gcsFolderNewIcon from '../../style/icons/gcs_folder_new_icon.svg';

const lightIconGcsFolder = new LabIcon({
  name: 'launcher:gcs-folder-icon',
  svgstr: gcsFolderIcon
});

const darkIconGcsFolder = new LabIcon({
  name: 'launcher:dark-gcs-folder-icon',
  svgstr: darkGcsFolderIcon
});

const lightIconSearch = new LabIcon({
  name: 'launcher:search-icon',
  svgstr: searchIcon
});

const darkIconSearch = new LabIcon({
  name: 'launcher:dark-search-icon',
  svgstr: darkSearchIcon
});

const lightIconSearchClear = new LabIcon({
  name: 'launcher:search-clear-icon',
  svgstr: searchClearIcon
});

const darkIconSearchClear = new LabIcon({
  name: 'launcher:dark-search-clear-icon',
  svgstr: darkSearchClearIcon
});

const iconGcsRefresh = new LabIcon({
  name: 'launcher:gcs-refresh-icon',
  svgstr: gcsRefreshIcon
});

const iconGcsFolderNew = new LabIcon({
  name: 'launcher:gcs-folder-new-icon',
  svgstr: gcsFolderNewIcon
});

const iconGcsUpload = new LabIcon({
  name: 'launcher:gcs-upload-icon',
  svgstr: gcsUploadIcon
});

const NewGcsBucketComponent = ({
  app,
  docManager,
  themeManager
}: {
  app: JupyterLab;
  docManager: IDocumentManager;
  themeManager: IThemeManager;
}): JSX.Element => {
  const isDarkTheme = !themeManager.isLight(themeManager.theme!);
  const inputFile = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // const [gcsFolderPath, setGcsFolderPath] = useState<string[]>([]);
  const [bucketsList, setBucketsList] = useState([]);
  const [breadCrumbs, setBreadCrumbs] = useState<any[]>([])

  interface IBucketItem {
    updated: string;
    items: any;
    name: string;
    lastModified: string;
    folderName: string;
  }

  const listBucketsAPI = async () => {
    setIsLoading(true);
    setBreadCrumbs([])
    const credentials = await authApi();
    if (credentials) {
      fetch(`${GCS_URL}?project=${credentials.project_id}`, {
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + credentials.access_token
        }
      })
        .then((response: Response) => {
          response
            .json()
            .then((responseResult: IBucketItem) => {
              let sortedResponse = responseResult.items.sort(
                (itemOne: IBucketItem, itemTwo: IBucketItem) =>
                  itemOne.name < itemTwo.name ? -1 : 1
              );
              setBucketsList(sortedResponse);
              setIsLoading(false);
            })
            .catch((e: Error) => {
              console.log(e);
              setIsLoading(false);
            });
        })
        .catch((err: Error) => {
          console.error('Failed to get buckets/objects list', err);
          setIsLoading(false);
          toast.error(
            `Failed to get buckets/objects list`,
            toastifyCustomStyle
          );
        });
    }
  };

  const createNewItem = async () => {
    console.log('New item created');
  };

  useEffect(
    () => {
      listBucketsAPI();
    },
    [
      // gcsFolderPath
    ]
  );

  var filteredBucketList =
    bucketsList &&
    bucketsList.length > 0 &&
    bucketsList.filter((list: any) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const lastModifiedDate = (updated: Date) => {
    const updatedDate = new Date(updated);
    const lastModified = lastModifiedFormat(updatedDate);
    return lastModified;
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const handleFileChange = () => {
    //@ts-ignore
    inputFile.current.click();
  };

  const fileUploadAction = () => {
    const files = Array.from(inputFile.current?.files || []);

    if (files.length > 0) {
      files.forEach(file => {
        uploadFilesToGCS(files);
      });
    }
  };

  const uploadFilesToGCS = async (files: File[]) => {
    console.log(files);
  };

  const fetchBucketsOrObjects = async (apiURL: string) => {
    setIsLoading(true);
    const credentials = await authApi();
    if (credentials) {
      fetch(apiURL, {
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + credentials.access_token
        }
      })
        .then((bucketObjects: Response) => {
          bucketObjects.json()
            .then((result: any) => {
              setBucketsList(result.items);
              setIsLoading(false);
            }
            )
        })
        .catch((err: Error) => {
          console.error('Failed to fetch file information', err);
          setIsLoading(false);
          toast.error(`Failed to fetch file information`, toastifyCustomStyle);
        });
    }
  }

  const openFileContent = async (apiURL: string) => {
    const credentials = await authApi();
    if (credentials) {
      fetch(apiURL, {
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + credentials.access_token
        }
      })
        .then((bucketObjects: Response) => {
          bucketObjects.json()
            .then((result: any) => {
              // docManager.openOrReveal('/need/to/set/path')
              console.log(result);
            }
            )
        })
        .catch((err: Error) => {
          console.error('Failed to fetch file information', err);
          toast.error(`Failed to fetch file information`, toastifyCustomStyle);
        });
    }
  }

  const handleFolderApi = (list: any) => {
    let listBucketOrObjectAPIURL: string = '';
    if (list.kind.includes('storage#bucket')) {
      // breadCrumbData=[...breadCrumbData,list]
      setBreadCrumbs([...breadCrumbs, list])
      listBucketOrObjectAPIURL = `${GCS_URL}/${list.name}/o?delimiter=\/&includeTrailingDelimiter=true`
      fetchBucketsOrObjects(listBucketOrObjectAPIURL);
    } else if (list.kind.includes('storage#object') && !list.name.endsWith('/')) {
      listBucketOrObjectAPIURL = `${GCS_URL}/${list.bucket}/o/${encodeURIComponent(list.name)}?alt=media`
      openFileContent(listBucketOrObjectAPIURL);
    } else if (list.kind.includes('storage#object')) {
      setBreadCrumbs([...breadCrumbs, list])
      // setBreadCrumbs({...breadCrumbs, list})
      listBucketOrObjectAPIURL = `${GCS_URL}/${list.bucket}/o?delimiter=\/&includeTrailingDelimiter=true&prefix=${list.name}&startOffset=${list.name}*`
      fetchBucketsOrObjects(listBucketOrObjectAPIURL);
    }
  }
  
  const displayFolderNames = (list: string) => {
    if (list.endsWith('/')) {
      let lastArr = list.split('/')
      if (lastArr.length > 2) {
        return lastArr[lastArr.length - 2]
      } else {
        return lastArr[0]
      }
    } else {
      return list.split('/').at(-1)
    }
  }

  return (
    <>
        <div className="lm-Widget jp-SidePanel jp-FileBrowser lm-StackedPanel-child">
          <div className="lm-Widget jp-Toolbar jp-SidePanel-toolbar jp-FileBrowser-toolbar">
            <div className="lm-Widget jp-CommandToolbarButton jp-Toolbar-item">
              <div className='header'>Google Cloud Storage</div>
                <div
                  onClick={() => listBucketsAPI()}
                  role="button"
                  className="lm-widget jp-CommandToolbarButton jp-Toolbar-item"
                >
                  <iconGcsRefresh.react tag="div" className="gcs-title-icons" />
                </div>
                <div
                  onClick={() => createNewItem()}
                  className="lm-widget jp-CommandToolbarButton jp-Toolbar-item"
                  role="button"
                >
                  <iconGcsFolderNew.react tag="div" className="gcs-title-icons" />
                </div>
                <div className="lm-widget jp-CommandToolbarButton jp-Toolbar-item">
                  <input
                    type="file"
                    id="file"
                    ref={inputFile}
                    style={{ display: 'none' }}
                    onChange={fileUploadAction}
                    multiple
                  />
                  <div onClick={handleFileChange} role="button">
                    <iconGcsUpload.react tag="div" className="gcs-title-icons" />
                  </div>
                </div>
              </div>
            </div>
            <div className="gcs-search">
                <TextField
                  placeholder="Filter files by name"
                  type="text"
                  variant="outlined"
                  fullWidth
                  size="small"
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {!isDarkTheme ? (
                          <lightIconSearch.react />
                        ) : (
                          <darkIconSearch.react />
                        )}
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleSearchClear}
                      >
                        {!isDarkTheme ? (
                          <lightIconSearchClear.react fontSize='small' />
                        ) : (
                          <darkIconSearchClear.react />
                        )}
                      </IconButton>
                    )
                  }}
                />
              </div>
          <div className='lm-Widget lm-Panel jp-SidePanel-content'>
            <div className='lm-Widget lm-Panel jp-FileBrowser-Panel'>
              <div className='lm-Widget jp-BreadCrumbs jp-FileBrowser-crumbs'>
                <span className='breadcrumb-folder-icon jp-BreadCrumbs-home' onClick={() => listBucketsAPI()}>
                  <lightIconGcsFolder.react /><span className='slash'>/</span>
                </span>
                {breadCrumbs.map((bread, index) => (
                <span className='breadcrumb-name' key={index}>
                  {bread.name.includes('/') ? displayFolderNames(bread.name) : bread.name}
                  <span className='slash'>/{" "}</span>
                </span>
                  ))
                }
              </div>
            <div className='lm-Widget jp-DirListing jp-FileBrowser-listing'>
              <div className="jp-DirListing-header">
                <div className="jp-DirListing-headerItem jp-id-name">
                  <span className="jp-DirListing-headerItemText">Name</span>
                </div>
                <div className="jp-DirListing-headerItem jp-id-modified">
                  <span className="jp-DirListing-headerItemText">
                    Last Modified
                  </span>
                </div>
              </div>
              {!isLoading ?
                <ul className="jp-DirListing-content gcs-DirListing-content">
                  {filteredBucketList &&
                    filteredBucketList.map((list: any, index: number) => {
                      return (
                        <li className="jp-DirListing-item" onDoubleClick={() => handleFolderApi(list)}>
                          <span className="jp-DirListing-itemIcon">
                            {isDarkTheme ? (
                              <darkIconGcsFolder.react />
                            ) : (
                              <lightIconGcsFolder.react />
                            )}
                          </span>
                          <span className="jp-DirListing-itemText">
                            {displayFolderNames(list.name)}
                          </span>
                          <span className="jp-DirListing-itemModified">
                            {lastModifiedDate(list.updated)}
                          </span>
                        </li>
                      );
                    })}
                </ul>
                : 
                  <div className="spin-loader">
                    <ClipLoader
                      color="#8A8A8A"
                      loading={true}
                      size={18}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                    Loading
                  </div>
                  }
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export class NewGcsBucket extends DataprocWidget {
  app: JupyterLab;
  docManager: IDocumentManager;
  themeManager!: IThemeManager;

  constructor(
    app: JupyterLab,
    docManager: IDocumentManager,
    themeManager: IThemeManager
  ) {
    super(themeManager);
    this.app = app;
    this.docManager = docManager;
  }

  renderInternal(): JSX.Element {
    return (
      <NewGcsBucketComponent
        app={this.app}
        docManager={this.docManager}
        themeManager={this.themeManager}
      />
    );
  }
}
