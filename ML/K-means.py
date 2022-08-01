import sys
import statistics
import numpy as np
import pandas as pd
import statsmodels.api as sm
import matplotlib.pyplot as plt
import seaborn as sns
import json
sns.set()
from sklearn.cluster import KMeans




def grammar(df):
    x = df.iloc[:,[1,3]]
    kmeans = KMeans(5)
    kmeans.fit(x)
    identified_clusters = kmeans.fit_predict(x).tolist()
    #print(identified_clusters[-1])
    result = {"grammar":identified_clusters[-1]}
    #res = json.dumps(result)
    return result

def concise(df):
    concise_list = []
    y = df.iloc[:,1:3]
    kmeans = KMeans(5)
    kmeans.fit(y)
    time_clusters = kmeans.fit_predict(y).tolist()
    concise_list.append(time_clusters[-1])
    x = df.iloc[:,4:]
    kmeans = KMeans(5)
    kmeans.fit(x)
    points_clusters = kmeans.fit_predict(x).tolist()
    concise_list.append(points_clusters[-1])
    concise_val = round(statistics.mean(concise_list),1)
    result = {"concise":concise_val}
    #res = json.dumps(result)
    return result
    
def main():
    data = pd.read_csv('./ML/FYP_ML_example.csv')
    user = pd.read_csv('./ML/user_predict.csv')
    #data = pd.read_csv('FYP_ML_example.csv')
    #user = pd.read_csv('user_predict.csv')
    user.drop(index=user.index[-1], 
        axis=0, 
        inplace=True)
    df = data.append(user, ignore_index=True)
    result = []
    result.append(grammar(df))
    result.append(concise(df))
    res = json.dumps(result)
    print(res)    

if __name__ == "__main__":
    main()

